import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.shipment_model import Shipment, PaymentStatus
from app.models.wallet_transaction_model import WalletTransaction, TransactionType, TransactionStatus
from app.utils import paystack


class WalletService:
    async def initiate_hold(self, shipment: Shipment, payer_email: str, session: AsyncSession, callback_url: str | None = None) -> str:
        reference = f"SHP-HOLD-{shipment.shipment_id}"
        existing = await session.execute(select(WalletTransaction).where(WalletTransaction.paystack_reference == reference))
        if existing.scalar_one_or_none():
            raise HTTPException(status.HTTP_409_CONFLICT, "A payment has already been initialized for this shipment.")

        checkout = await paystack.initialize_transaction(
            email=payer_email,
            amount_kobo=shipment.delivery_fee + shipment.service_fee,
            reference=reference,
            callback_url=callback_url,
        )
        txn = WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.vendor_id,
            type=TransactionType.ESCROW_HOLD,
            amount=shipment.delivery_fee + shipment.service_fee,
            status=TransactionStatus.PENDING,
            paystack_reference=reference,
        )
        session.add(txn)
        await session.commit()
        return checkout["authorization_url"]

    async def confirm_hold(self, shipment: Shipment, session: AsyncSession) -> bool:
        if shipment.payment_status == PaymentStatus.HELD:
            return True
        reference = f"SHP-HOLD-{shipment.shipment_id}"
        result = await session.execute(select(WalletTransaction).where(WalletTransaction.paystack_reference == reference))
        txn = result.scalar_one_or_none()
        if not txn:
            return False
        verified = await paystack.verify_transaction(reference)
        if verified.get("status") != "success":
            return False
        expected = shipment.delivery_fee + shipment.service_fee
        if int(verified.get("amount", 0)) != expected:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Paystack amount does not match shipment total.")
        txn.status = TransactionStatus.SUCCESS
        shipment.payment_status = PaymentStatus.HELD
        session.add_all([txn, shipment])
        await session.commit()
        return True

    # =========================
    # PAY FOR A SHIPMENT FROM THE VENDOR'S SHIPORA BALANCE
    #
    # Replaces the old "fresh Paystack checkout per shipment" flow for
    # vendor-paid shipments. No Paystack call, no webhook round-trip —
    # the balance is already sitting in Shipora's settlement account
    # from a previous top-up, so this just debits the ledger.
    # =========================

    async def pay_from_balance(self, shipment: Shipment, session: AsyncSession) -> Shipment:
        if shipment.payment_status == PaymentStatus.HELD:
            return shipment  # idempotent — already paid

        total = shipment.delivery_fee + shipment.service_fee
        balance = await self.get_balance(shipment.vendor_id, session)
        if total > balance["available_balance"]:
            shortfall = total - balance["available_balance"]
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Insufficient Shipora balance — you're short by ₦{shortfall / 100:,.2f}. Top up your wallet first.",
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
        session.add(shipment)
        await session.commit()
        await session.refresh(shipment)
        return shipment

    # =========================
    # TOP UP — the only place a vendor's real card/bank money enters Shipora
    # =========================

    async def initiate_topup(self, user_id: uuid.UUID, email: str, amount_kobo: int, session: AsyncSession, callback_url: str | None = None) -> str:
        if amount_kobo <= 0:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Top-up amount must be greater than zero.")

        reference = f"SHP-TOPUP-{uuid.uuid4().hex[:16]}"
        checkout = await paystack.initialize_transaction(
            email=email, amount_kobo=amount_kobo, reference=reference, callback_url=callback_url,
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

    async def confirm_topup(self, reference: str, session: AsyncSession) -> WalletTransaction:
        result = await session.execute(select(WalletTransaction).where(WalletTransaction.paystack_reference == reference))
        txn = result.scalar_one_or_none()
        if not txn or txn.type != TransactionType.TOPUP:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Top-up transaction not found.")
        if txn.status == TransactionStatus.SUCCESS:
            return txn  # idempotent — Paystack can retry the webhook

        verified = await paystack.verify_transaction(reference)
        if verified.get("status") != "success":
            txn.status = TransactionStatus.FAILED
            session.add(txn)
            await session.commit()
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "This payment was not successful.")

        if int(verified.get("amount", 0)) != txn.amount:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Paystack amount does not match the top-up request.")

        txn.status = TransactionStatus.SUCCESS
        session.add(txn)
        await session.commit()
        await session.refresh(txn)
        return txn

    async def release_to_dispatcher(self, shipment: Shipment, session: AsyncSession):
        """
        Escrow release no longer transfers to the dispatcher's bank directly.
        It credits their in-app Shipora balance (this ledger IS the balance —
        see get_balance). The dispatcher moves it to their bank later via
        withdraw(), whenever they want, in one or several withdrawals.
        No bank account is required on the dispatcher at this point.
        """
        if shipment.payment_status == PaymentStatus.RELEASED:
            return
        reference = f"SHP-RELEASE-{shipment.shipment_id}"
        payout_amount = shipment.delivery_fee - shipment.platform_commission
        release_txn = WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.dispatcher_id,
            type=TransactionType.ESCROW_RELEASE,
            amount=payout_amount,
            status=TransactionStatus.SUCCESS,
            paystack_reference=reference,
        )
        commission_txn = WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.vendor_id,
            type=TransactionType.PLATFORM_COMMISSION,
            amount=shipment.platform_commission,
            status=TransactionStatus.SUCCESS,
        )
        session.add_all([release_txn, commission_txn])
        shipment.payment_status = PaymentStatus.RELEASED
        session.add(shipment)
        await session.commit()

    async def cancel_after_assignment(self, shipment: Shipment, session: AsyncSession, fee_kobo: int):
        if shipment.payment_status != PaymentStatus.HELD:
            shipment.payment_status = PaymentStatus.REFUNDED
            await session.commit()
            return
        hold_ref = f"SHP-HOLD-{shipment.shipment_id}"
        hold_result = await session.execute(select(WalletTransaction).where(WalletTransaction.paystack_reference == hold_ref))
        hold = hold_result.scalar_one_or_none()
        if not hold:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Original payment ledger entry not found.")
        refund_amount = max(0, hold.amount - fee_kobo)
        await paystack.refund_transaction(hold_ref, refund_amount)
        session.add(WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.vendor_id,
            type=TransactionType.REFUND,
            amount=refund_amount,
            status=TransactionStatus.SUCCESS,
            paystack_reference=f"SHP-REFUND-{shipment.shipment_id}",
        ))
        # cancellation fee is credited to the dispatcher's Shipora balance, same as a normal release
        session.add(WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.dispatcher_id,
            type=TransactionType.ESCROW_RELEASE,
            amount=fee_kobo,
            status=TransactionStatus.SUCCESS,
            paystack_reference=f"SHP-CANCEL-FEE-{shipment.shipment_id}",
        ))
        shipment.payment_status = PaymentStatus.REFUNDED
        session.add(shipment)
        await session.commit()

    async def refund_to_vendor(self, shipment: Shipment, session: AsyncSession, reason: str = "Shipora refund"):
        if shipment.payment_status == PaymentStatus.REFUNDED:
            return
        reference = f"SHP-HOLD-{shipment.shipment_id}"
        result = await session.execute(select(WalletTransaction).where(
            WalletTransaction.paystack_reference == reference,
            WalletTransaction.type == TransactionType.ESCROW_HOLD,
        ))
        hold = result.scalar_one_or_none()
        if not hold or hold.status != TransactionStatus.SUCCESS:
            shipment.payment_status = PaymentStatus.REFUNDED
            session.add(shipment)
            await session.commit()
            return

        await paystack.refund_transaction(reference, hold.amount)
        refund_txn = WalletTransaction(
            shipment_id=shipment.shipment_id,
            user_id=shipment.vendor_id,
            type=TransactionType.REFUND,
            amount=hold.amount,
            status=TransactionStatus.SUCCESS,
            paystack_reference=f"SHP-REFUND-{shipment.shipment_id}",
        )
        shipment.payment_status = PaymentStatus.REFUNDED
        session.add_all([refund_txn, shipment])
        await session.commit()

    # =========================
    # IN-APP WALLET BALANCE + WITHDRAWALS
    #
    # There's still no real per-user bank account on Paystack's side — the
    # money physically sits in Shipora's own Paystack settlement balance the
    # whole time. What changes is *when* a Transfer actually fires:
    #   - release_to_dispatcher / cancel_after_assignment only write ledger
    #     rows (ESCROW_RELEASE) — no Transfer call, so no bank account is
    #     required for a dispatcher to complete jobs and earn.
    #   - withdraw() is the only place that calls paystack.initiate_transfer,
    #     and only up to what the ledger says this user has actually earned
    #     and hasn't already withdrawn (or has a withdrawal in flight for).
    # =========================

    async def get_balance(self, user_id: uuid.UUID, session: AsyncSession) -> dict:
        """
        The available balance isn't stored anywhere — it's derived from the
        ledger every time, so it can never drift out of sync with the
        transaction history the Wallet page shows:

            available = (topped_up + earned + refunded) - (spent + withdrawn + pending_withdrawal)
        """
        result = await session.execute(
            select(WalletTransaction).where(
                WalletTransaction.user_id == user_id,
                WalletTransaction.status.in_([TransactionStatus.SUCCESS, TransactionStatus.PENDING]),
            )
        )
        transactions = result.scalars().all()

        def total(type_: TransactionType, statuses: list[TransactionStatus]) -> int:
            return sum(t.amount for t in transactions if t.type == type_ and t.status in statuses)

        success = [TransactionStatus.SUCCESS]
        total_topped_up = total(TransactionType.TOPUP, success)
        total_earned = total(TransactionType.ESCROW_RELEASE, success)
        total_refunded = total(TransactionType.REFUND, success)
        total_spent = total(TransactionType.ESCROW_HOLD, success)
        total_withdrawn = total(TransactionType.WITHDRAWAL, success)
        pending_withdrawal = total(TransactionType.WITHDRAWAL, [TransactionStatus.PENDING])

        credits = total_topped_up + total_earned + total_refunded
        debits = total_spent + total_withdrawn + pending_withdrawal

        return {
            "total_topped_up": total_topped_up,
            "total_earned": total_earned,
            "total_refunded": total_refunded,
            "total_spent": total_spent,
            "total_withdrawn": total_withdrawn,
            "pending_withdrawal": pending_withdrawal,
            "available_balance": max(0, credits - debits),
        }

    async def list_transactions(self, user_id: uuid.UUID, session: AsyncSession):
        result = await session.execute(
            select(WalletTransaction).where(WalletTransaction.user_id == user_id)
            .order_by(WalletTransaction.created_at.desc())
        )
        return result.scalars().all()

    async def withdraw(self, user_id: uuid.UUID, amount_kobo: int, session: AsyncSession) -> WalletTransaction:
        from app.services.profile_services import ProfileService  # local import avoids a circular import

        if amount_kobo <= 0:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Withdrawal amount must be greater than zero.")

        profile_service = ProfileService()
        # role-agnostic — a vendor withdrawing unspent top-up balance works
        # exactly the same way as a dispatcher withdrawing job earnings
        profile = await profile_service.get_bank_profile(user_id, session)
        if not profile:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No verified profile found for this account.")
        if not profile.bank_code or not profile.account_number:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Add a bank account to your profile before withdrawing.")

        balance = await self.get_balance(user_id, session)
        if amount_kobo > balance["available_balance"]:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Withdrawal amount exceeds available balance.")

        recipient_code = profile.paystack_recipient_code
        if not recipient_code:
            recipient_code = await paystack.create_transfer_recipient(
                name=profile.full_name,
                account_number=profile.account_number,
                bank_code=profile.bank_code,
            )
            profile.row.paystack_recipient_code = recipient_code
            session.add(profile.row)
            await session.commit()

        reference = f"SHP-WITHDRAW-{uuid.uuid4().hex[:12]}"
        transfer = await paystack.initiate_transfer(
            recipient_code=recipient_code,
            amount_kobo=amount_kobo,
            reason="Shipora wallet withdrawal",
            reference=reference,
        )
        status_value = (
            TransactionStatus.SUCCESS if transfer.get("status") == "success"
            else TransactionStatus.PENDING if transfer.get("status") == "pending"
            else TransactionStatus.FAILED
        )
        txn = WalletTransaction(
            user_id=user_id,
            shipment_id=None,
            type=TransactionType.WITHDRAWAL,
            amount=amount_kobo,
            status=status_value,
            paystack_reference=reference,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)
        if status_value == TransactionStatus.FAILED:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Withdrawal could not be initiated. Try again shortly.")
        return txn
