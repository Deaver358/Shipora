from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_config import session
from app.core.dependencies import get_this_user
from app.models.user_model import User
from app.schema.wallet_schema import WalletBalanceResponse, WalletTransactionResponse, WithdrawRequest, TopupRequest
from app.services.wallet_services import WalletService
from app.services.notification_services import NotificationService
from app.models.notification_model import NotificationType
from app.models.wallet_transaction_model import TransactionStatus, WalletTransaction, TransactionType
from app.utils.fees import kobo
from app.utils.config import settings

router = APIRouter()
wallet_service = WalletService()
notification_service = NotificationService()


def _to_naira(kobo_amount: int) -> float:
    return round(kobo_amount / 100, 2)


@router.post("/topup")
async def topup_wallet(data: TopupRequest, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    authorization_url = await wallet_service.initiate_topup(
        user_id=user.uid,
        email=user.email,
        amount_kobo=kobo(data.amount),
        session=session,
        # Paystack appends ?trxref=...&reference=... to this URL
        callback_url=f"{settings.frontend_url}/payment-result",
    )
    return {"authorization_url": authorization_url}


@router.get("/topup/verify/{reference}")
async def verify_topup(reference: str, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    """
    Confirms a top-up when the user returns from Paystack. The webhook does
    the same thing; whichever arrives first credits the wallet (idempotent).
    """
    txn = (await session.execute(
        select(WalletTransaction).where(
            WalletTransaction.paystack_reference == reference,
            WalletTransaction.type == TransactionType.TOPUP,
        )
    )).scalar_one_or_none()

    if not txn or txn.user_id != user.uid:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Top-up transaction not found.")

    already_done = txn.status == TransactionStatus.SUCCESS
    txn = await wallet_service.confirm_topup(reference, session)

    if not already_done:
        await notification_service.notify(
            user_id=user.uid,
            type=NotificationType.PAYMENT,
            title="Wallet topped up",
            message=f"₦{txn.amount / 100:,.2f} was added to your Shipora balance.",
            session=session,
        )

    balance = await wallet_service.get_balance(user.uid, session)
    return {
        "status": txn.status.value,
        "reference": txn.paystack_reference,
        "amount": _to_naira(txn.amount),
        "available_balance": _to_naira(balance["available_balance"]),
    }


@router.get("/balance", response_model=WalletBalanceResponse)
async def get_balance(user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    balance = await wallet_service.get_balance(user.uid, session)
    return {k: _to_naira(v) for k, v in balance.items()}


@router.get("/transactions", response_model=list[WalletTransactionResponse])
async def list_transactions(user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    transactions = await wallet_service.list_transactions(user.uid, session)
    return [
        WalletTransactionResponse(
            transaction_id=t.transaction_id,
            shipment_id=t.shipment_id,
            type=t.type,
            amount=_to_naira(t.amount),
            status=t.status,
            paystack_reference=t.paystack_reference,
            created_at=t.created_at,
        )
        for t in transactions
    ]


@router.post("/withdraw", response_model=WalletTransactionResponse)
async def withdraw(data: WithdrawRequest, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    txn = await wallet_service.withdraw(user.uid, kobo(data.amount), session)
    title = "Withdrawal on its way" if txn.status != TransactionStatus.PENDING else "Withdrawal processing"
    await notification_service.notify(
        user_id=user.uid,
        type=NotificationType.PAYMENT,
        title=title,
        message=f"Your withdrawal of ₦{data.amount:,.2f} to your bank account is being processed.",
        session=session,
    )
    return WalletTransactionResponse(
        transaction_id=txn.transaction_id,
        shipment_id=txn.shipment_id,
        type=txn.type,
        amount=_to_naira(txn.amount),
        status=txn.status,
        paystack_reference=txn.paystack_reference,
        created_at=txn.created_at,
    )
