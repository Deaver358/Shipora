import logging
import uuid

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.shipment_model import Shipment, PaymentStatus
from app.models.wallet_transaction_model import (
    WalletTransaction,
    TransactionType,
    TransactionStatus,
)
from app.utils import paystack

logger = logging.getLogger("shipora.wallet")

# Paystack transaction statuses that will never turn into a successful charge
PAYSTACK_FINAL_FAILURES = {"failed", "reversed"}


async def lock_wallet(user_id, session: AsyncSession) -> None:
    """
    Serialise balance-changing operations for one user (withdrawals and
    wallet payments) so two concurrent requests can't both spend the same
    money. The lock is released automatically at COMMIT/ROLLBACK.
    """
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(:key))"),
        {"key": f"shipora-wallet:{user_id}"},
    )


class WalletService:

    # =========================================================
    # HELPERS
    # =========================================================

    async def _successful_hold(self, shipment_id, session: AsyncSession):
        result = await session.execute(
            select(WalletTransaction)
            .where(
                WalletTransaction.shipment_id == shipment_id,
                WalletTransaction.type == TransactionType.ESCROW_HOLD,
                WalletTransaction.status == TransactionStatus.SUCCESS,
            )
            .order_by(WalletTransaction.created_at.asc())
        )
        return result.scalars().first()

    async def _existing(self, shipment_id, type_: TransactionType, session: AsyncSession):
        result = await session.execute(
            select(WalletTransaction).where(
                WalletTransaction.shipment_id == shipment_id,
                WalletTransaction.type == type_,
                WalletTransaction.status == TransactionStatus.SUCCESS,
            )
        )
        return result.scalars().first()

    # =========================================================
    # CUSTOMER PAYS FOR A SHIPMENT VIA PAYSTACK CHECKOUT
    # =========================================================

    async def initiate_hold(
        self,
        shipment: Shipment,
        payer_email: str,
        session: AsyncSession,
        callback_url: str | None = None,
    ) -> str:
        if shipment.payment_status == PaymentStatus.HELD or await self._successful_hold(shipment.shipment_id, session):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "This shipment has already been paid for.",
            )

        # A fresh reference per attempt: Paystack rejects re-used references,
        # so a customer who abandoned checkout can simply try again.
        reference = f"SHP-HOLD-{shipment.shipment_id}-{uuid.uuid4().hex[:8]}"
        amount = shipment.delivery_fee + shipment.service_fee

        checkout = await paystack.initialize_transaction(
            email=payer_email,
            amount_kobo=amount,
            reference=reference,
            callback_url=callback_url,
        )

        txn = WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.vendor_id,
            type=TransactionType.ESCROW_HOLD,
            amount=amount,
            status=TransactionStatus.PENDING,
            paystack_reference=reference,
        )

        session.add(txn)
        await session.commit()

        return checkout["authorization_url"]

    async def confirm_hold(
        self,
        shipment: Shipment,
        session: AsyncSession,
        reference: str | None = None,
    ) -> bool:
        if shipment.payment_status == PaymentStatus.HELD:
            return True

        query = select(WalletTransaction).where(
            WalletTransaction.shipment_id == shipment.shipment_id,
            WalletTransaction.type == TransactionType.ESCROW_HOLD,
            WalletTransaction.status == TransactionStatus.PENDING,
        )
        if reference:
            query = query.where(WalletTransaction.paystack_reference == reference)

        pending = (await session.execute(query.order_by(WalletTransaction.created_at.desc()))).scalars().all()

        if not pending:
            return False

        expected = shipment.delivery_fee + shipment.service_fee

        for txn in pending:
            try:
                verified = await paystack.verify_transaction(txn.paystack_reference)
            except paystack.PaystackError as exc:
                logger.warning("Could not verify %s: %s", txn.paystack_reference, exc)
                continue

            paystack_status = str(verified.get("status") or "").lower()

            if paystack_status in PAYSTACK_FINAL_FAILURES:
                txn.status = TransactionStatus.FAILED
                session.add(txn)
                continue

            if paystack_status != "success":
                continue

            if int(verified.get("amount", 0)) != expected:
                logger.error(
                    "Amount mismatch for %s: paid %s, expected %s",
                    txn.paystack_reference, verified.get("amount"), expected,
                )
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    "Paystack amount does not match shipment total.",
                )

            txn.status = TransactionStatus.SUCCESS
            shipment.payment_status = PaymentStatus.HELD

            # The customer's money funds the escrow, not the vendor's balance.
            session.add(
                WalletTransaction(
                    shipment_id=shipment.shipment_id,
                    user_id=shipment.vendor_id,
                    type=TransactionType.CUSTOMER_PAYMENT,
                    amount=expected,
                    status=TransactionStatus.SUCCESS,
                    paystack_reference=f"SHP-CUSTPAY-{shipment.shipment_id}",
                )
            )
            session.add_all([txn, shipment])
            await session.commit()
            return True

        await session.commit()
        return False

    # =========================================================
    # PAY FOR SHIPMENT FROM VENDOR'S SHIPORA BALANCE
    # =========================================================

    async def pay_from_balance(
        self,
        shipment: Shipment,
        session: AsyncSession,
    ) -> Shipment:

        if shipment.payment_status == PaymentStatus.HELD:
            return shipment

        await lock_wallet(shipment.vendor_id, session)

        if await self._successful_hold(shipment.shipment_id, session):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "This shipment has already been paid for.",
            )

        total = shipment.delivery_fee + shipment.service_fee

        balance = await self.get_balance(
            shipment.vendor_id,
            session,
        )

        if total > balance["available_balance"]:
            shortfall = total - balance["available_balance"]

            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Insufficient Shipora balance — you're short by "
                f"₦{shortfall / 100:,.2f}. Top up your wallet first.",
            )

        txn = WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.vendor_id,
            type=TransactionType.ESCROW_HOLD,
            amount=total,
            status=TransactionStatus.SUCCESS,
            paystack_reference=f"SHP-HOLD-{shipment.shipment_id}",
        )

        session.add(txn)

        shipment.payment_status = PaymentStatus.HELD
        # The vendor funded this shipment from their wallet.
        shipment.payment_by = "vendor"

        session.add(shipment)

        await session.commit()
        await session.refresh(shipment)

        return shipment

    # =========================================================
    # TOP UP
    # =========================================================

    async def initiate_topup(
        self,
        user_id: uuid.UUID,
        email: str,
        amount_kobo: int,
        session: AsyncSession,
        callback_url: str | None = None,
    ) -> str:

        if amount_kobo <= 0:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Top-up amount must be greater than zero.",
            )

        reference = f"SHP-TOPUP-{uuid.uuid4().hex[:16]}"

        checkout = await paystack.initialize_transaction(
            email=email,
            amount_kobo=amount_kobo,
            reference=reference,
            callback_url=callback_url,
        )

        txn = WalletTransaction(
            shipment_id=None,
            user_id=user_id,
            type=TransactionType.TOPUP,
            amount=amount_kobo,
            status=TransactionStatus.PENDING,
            paystack_reference=reference,
        )

        session.add(txn)
        await session.commit()

        return checkout["authorization_url"]

    async def confirm_topup(
        self,
        reference: str,
        session: AsyncSession,
    ) -> WalletTransaction:

        result = await session.execute(
            select(WalletTransaction)
            .where(WalletTransaction.paystack_reference == reference)
            .with_for_update()
        )

        txn = result.scalar_one_or_none()

        if not txn or txn.type != TransactionType.TOPUP:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "Top-up transaction not found.",
            )

        if txn.status == TransactionStatus.SUCCESS:
            return txn

        verified = await paystack.verify_transaction(reference)
        paystack_status = str(verified.get("status") or "").lower()

        if paystack_status in PAYSTACK_FINAL_FAILURES:
            txn.status = TransactionStatus.FAILED

            session.add(txn)
            await session.commit()

            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This payment was not successful.",
            )

        if paystack_status != "success":
            # abandoned / ongoing / pending: the customer may still complete it
            await session.rollback()
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "This payment has not been completed yet.",
            )

        if int(verified.get("amount", 0)) != txn.amount:
            await session.rollback()
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Paystack amount does not match the top-up request.",
            )

        txn.status = TransactionStatus.SUCCESS

        session.add(txn)

        await session.commit()
        await session.refresh(txn)

        return txn

    # =========================================================
    # RELEASE ESCROW TO DISPATCHER
    # =========================================================

    async def release_to_dispatcher(
        self,
        shipment: Shipment,
        session: AsyncSession,
    ):

        if shipment.payment_status == PaymentStatus.RELEASED:
            return

        reference = f"SHP-RELEASE-{shipment.shipment_id}"

        existing = await session.execute(
            select(WalletTransaction).where(WalletTransaction.paystack_reference == reference)
        )
        if existing.scalar_one_or_none():
            shipment.payment_status = PaymentStatus.RELEASED
            session.add(shipment)
            await session.commit()
            return

        payout_amount = (
            shipment.delivery_fee
            - shipment.platform_commission
        )

        release_txn = WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.dispatcher_id,
            type=TransactionType.ESCROW_RELEASE,
            amount=payout_amount,
            status=TransactionStatus.SUCCESS,
            paystack_reference=reference,
        )

        # Informational ledger line (not part of the balance maths): the
        # commission is withheld from the dispatcher's payout, so it belongs
        # on the dispatcher's history — see WalletTransaction.user_id.
        commission_txn = WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.dispatcher_id,
            type=TransactionType.PLATFORM_COMMISSION,
            amount=shipment.platform_commission,
            status=TransactionStatus.SUCCESS,
        )

        session.add_all(
            [
                release_txn,
                commission_txn,
            ]
        )

        shipment.payment_status = PaymentStatus.RELEASED

        session.add(shipment)

        await session.commit()

    # =========================================================
    # CANCEL AFTER ASSIGNMENT
    # =========================================================

    async def cancel_after_assignment(
        self,
        shipment: Shipment,
        session: AsyncSession,
        fee_kobo: int,
    ):
        """
        Refund the vendor's Shipora balance minus the cancellation fee, and
        credit the fee to the assigned dispatcher. Ledger-only: money stays
        inside Shipora (see WalletTransaction docstring).
        """

        if shipment.payment_status != PaymentStatus.HELD:
            shipment.payment_status = PaymentStatus.REFUNDED
            session.add(shipment)
            await session.commit()

            return

        hold = await self._successful_hold(shipment.shipment_id, session)

        if not hold:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Original payment ledger entry not found.",
            )

        fee_kobo = max(0, min(fee_kobo, hold.amount))
        refund_amount = hold.amount - fee_kobo

        if refund_amount > 0:
            session.add(
                WalletTransaction(
                    shipment_id=shipment.shipment_id,
                    user_id=shipment.vendor_id,
                    type=TransactionType.REFUND,
                    amount=refund_amount,
                    status=TransactionStatus.SUCCESS,
                    paystack_reference=f"SHP-REFUND-{shipment.shipment_id}",
                )
            )

        if fee_kobo > 0 and shipment.dispatcher_id:
            session.add(
                WalletTransaction(
                    shipment_id=shipment.shipment_id,
                    user_id=shipment.dispatcher_id,
                    type=TransactionType.ESCROW_RELEASE,
                    amount=fee_kobo,
                    status=TransactionStatus.SUCCESS,
                    paystack_reference=f"SHP-CANCEL-FEE-{shipment.shipment_id}",
                )
            )

        shipment.payment_status = PaymentStatus.REFUNDED

        session.add(shipment)

        await session.commit()

    # =========================================================
    # REFUND TO VENDOR
    # =========================================================

    async def refund_to_vendor(
        self,
        shipment: Shipment,
        session: AsyncSession,
        reason: str = "Shipora refund",
    ):
        """
        Return the escrowed amount to the vendor's Shipora balance. The
        vendor can spend it on another shipment or withdraw it to their bank.

        This used to call Paystack's refund API, which fails for shipments
        paid from the wallet (Paystack never saw that money) and would
        double-refund card payments that are also credited to the wallet.
        """

        if shipment.payment_status == PaymentStatus.REFUNDED:
            return

        hold = await self._successful_hold(shipment.shipment_id, session)

        if not hold or await self._existing(shipment.shipment_id, TransactionType.REFUND, session):
            shipment.payment_status = PaymentStatus.REFUNDED

            session.add(shipment)

            await session.commit()

            return

        refund_txn = WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.vendor_id,
            type=TransactionType.REFUND,
            amount=hold.amount,
            status=TransactionStatus.SUCCESS,
            paystack_reference=f"SHP-REFUND-{shipment.shipment_id}",
        )

        shipment.payment_status = PaymentStatus.REFUNDED

        session.add_all(
            [
                refund_txn,
                shipment,
            ]
        )

        await session.commit()
        logger.info("Refunded %s kobo to vendor for shipment %s (%s)", hold.amount, shipment.shipment_id, reason)

    # =========================================================
    # WALLET BALANCE
    # =========================================================

    async def get_balance(
        self,
        user_id: uuid.UUID,
        session: AsyncSession,
    ) -> dict:
        """
        Calculates the user's wallet balance from the ledger.

        available_balance:
            Money currently available to spend or withdraw.

        held_for_delivery:
            Money currently locked in shipments whose payment status
            is HELD.

            Once a shipment becomes RELEASED or REFUNDED, it is no
            longer counted as held.
        """

        result = await session.execute(
            select(
                WalletTransaction.type,
                WalletTransaction.status,
                func.coalesce(func.sum(WalletTransaction.amount), 0),
            )
            .where(
                WalletTransaction.user_id == user_id,
                WalletTransaction.status.in_(
                    [
                        TransactionStatus.SUCCESS,
                        TransactionStatus.PENDING,
                    ]
                ),
            )
            .group_by(WalletTransaction.type, WalletTransaction.status)
        )

        sums = {(row[0], row[1]): int(row[2] or 0) for row in result.all()}

        def total(
            type_: TransactionType,
            statuses: list[TransactionStatus],
        ) -> int:
            return sum(sums.get((type_, s), 0) for s in statuses)

        success = [TransactionStatus.SUCCESS]

        total_topped_up = total(
            TransactionType.TOPUP,
            success,
        )

        total_customer_payments = total(
            TransactionType.CUSTOMER_PAYMENT,
            success,
        )

        total_earned = total(
            TransactionType.ESCROW_RELEASE,
            success,
        )

        total_refunded = total(
            TransactionType.REFUND,
            success,
        )

        total_spent = total(
            TransactionType.ESCROW_HOLD,
            success,
        )

        total_withdrawn = total(
            TransactionType.WITHDRAWAL,
            success,
        )

        pending_withdrawal = total(
            TransactionType.WITHDRAWAL,
            [
                TransactionStatus.PENDING
            ],
        )

        # =====================================================
        # CURRENT ESCROW / HELD FOR DELIVERY
        # =====================================================

        held_result = await session.execute(
            select(
                func.coalesce(
                    func.sum(
                        Shipment.delivery_fee
                        + Shipment.service_fee
                    ),
                    0,
                )
            ).where(
                Shipment.vendor_id == user_id,
                Shipment.payment_status == PaymentStatus.HELD,
            )
        )

        held_for_delivery = int(
            held_result.scalar_one() or 0
        )

        # =====================================================
        # AVAILABLE BALANCE
        # =====================================================

        credits = (
            total_topped_up
            + total_customer_payments
            + total_earned
            + total_refunded
        )

        debits = (
            total_spent
            + total_withdrawn
            + pending_withdrawal
        )

        available_balance = max(
            0,
            credits - debits,
        )

        return {
            "total_topped_up": total_topped_up,
            "total_earned": total_earned,
            "total_refunded": total_refunded,
            "total_spent": total_spent,
            "total_withdrawn": total_withdrawn,
            "pending_withdrawal": pending_withdrawal,
            "available_balance": available_balance,
            "held_for_delivery": held_for_delivery,
        }

    # =========================================================
    # TRANSACTION HISTORY
    # =========================================================

    async def list_transactions(
        self,
        user_id: uuid.UUID,
        session: AsyncSession,
    ):
        result = await session.execute(
            select(WalletTransaction)
            .where(
                WalletTransaction.user_id == user_id
            )
            .order_by(
                WalletTransaction.created_at.desc()
            )
        )

        return result.scalars().all()

    # =========================================================
    # WITHDRAWAL
    # =========================================================

    async def withdraw(
        self,
        user_id: uuid.UUID,
        amount_kobo: int,
        session: AsyncSession,
    ) -> WalletTransaction:

        from app.services.profile_services import ProfileService

        if amount_kobo <= 0:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Withdrawal amount must be greater than zero.",
            )

        profile_service = ProfileService()

        profile = await profile_service.get_bank_profile(
            user_id,
            session,
        )

        if not profile:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "No verified profile found for this account.",
            )

        if not profile.bank_code or not profile.account_number:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Add a bank account to your profile before withdrawing.",
            )

        recipient_code = profile.paystack_recipient_code

        if not recipient_code:
            recipient_code = await paystack.create_transfer_recipient(
                name=profile.account_name or profile.full_name,
                account_number=profile.account_number,
                bank_code=profile.bank_code,
            )

            profile.row.paystack_recipient_code = recipient_code

            session.add(profile.row)

            await session.commit()

        # ---- reserve the money first (inside a per-user lock) ----------
        await lock_wallet(user_id, session)

        balance = await self.get_balance(
            user_id,
            session,
        )

        if amount_kobo > balance["available_balance"]:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Withdrawal amount exceeds available balance.",
            )

        reference = (
            f"SHP-WITHDRAW-{uuid.uuid4().hex[:12]}"
        )

        txn = WalletTransaction(
            user_id=user_id,
            shipment_id=None,
            type=TransactionType.WITHDRAWAL,
            amount=amount_kobo,
            status=TransactionStatus.PENDING,
            paystack_reference=reference,
        )

        session.add(txn)

        # PENDING withdrawals already count against the balance, so once this
        # commits a second concurrent request can't spend the same money.
        await session.commit()

        # ---- then move the money --------------------------------------
        try:
            transfer = await paystack.initiate_transfer(
                recipient_code=recipient_code,
                amount_kobo=amount_kobo,
                reason="Shipora wallet withdrawal",
                reference=reference,
            )
        except paystack.PaystackError as exc:
            if exc.definitive:
                txn.status = TransactionStatus.FAILED
                session.add(txn)
                await session.commit()
                raise HTTPException(
                    status.HTTP_502_BAD_GATEWAY,
                    f"Withdrawal could not be initiated: {exc}",
                )
            # Outcome unknown (timeout): keep it PENDING. The Paystack
            # transfer webhook settles it as success / failed.
            logger.warning("Withdrawal %s outcome unknown: %s", reference, exc)
            await session.refresh(txn)
            return txn

        transfer_status = str(transfer.get("status") or "").lower()

        if transfer_status == "success":
            txn.status = TransactionStatus.SUCCESS
        elif transfer_status in ("failed", "reversed", "abandoned", "rejected"):
            txn.status = TransactionStatus.FAILED
        # "pending" / "otp" / "queued" / "processing" stay PENDING until the webhook

        session.add(txn)

        await session.commit()
        await session.refresh(txn)

        if txn.status == TransactionStatus.FAILED:
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                "Withdrawal could not be initiated. Try again shortly.",
            )

        return txn

    async def settle_withdrawal(
        self,
        reference: str,
        succeeded: bool,
        session: AsyncSession,
    ) -> WalletTransaction | None:
        """Called from Paystack transfer.success / transfer.failed / transfer.reversed webhooks."""
        result = await session.execute(
            select(WalletTransaction)
            .where(
                WalletTransaction.paystack_reference == reference,
                WalletTransaction.type == TransactionType.WITHDRAWAL,
            )
            .with_for_update()
        )
        txn = result.scalar_one_or_none()

        if not txn:
            return None

        new_status = TransactionStatus.SUCCESS if succeeded else TransactionStatus.FAILED

        if txn.status != new_status:
            txn.status = new_status
            session.add(txn)
            await session.commit()
            await session.refresh(txn)
        else:
            await session.commit()

        return txn
