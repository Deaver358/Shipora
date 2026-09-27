import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class TransactionType(str, Enum):
    TOPUP = "topup"                    # vendor funds their Shipora wallet via Paystack
    ESCROW_HOLD = "escrow_hold"        # debited from the vendor's Shipora balance for a shipment
    ESCROW_RELEASE = "escrow_release"  # credited to the dispatcher's in-app Shipora balance
    REFUND = "refund"                  # credited back to the vendor's Shipora balance
    PLATFORM_COMMISSION = "platform_commission"
    WITHDRAWAL = "withdrawal"          # balance moved out to a linked bank account (either role)


class TransactionStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class WalletTransaction(SQLModel, table=True):
    """
    Every naira movement in Shipora happens here — this table IS the
    wallet. A user's available balance is computed from it (see
    WalletService.get_balance), not stored as a column anywhere: top-ups
    and completed jobs are credits, shipment payments and withdrawals
    are debits. The only place real money crosses in or out of Paystack
    is a TOPUP (money in) or a WITHDRAWAL (money out) — everything else
    is an internal ledger entry.
    """

    __tablename__ = "wallet_transactions"

    transaction_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(
            pg.UUID,
            primary_key=True,
            unique=True,
            nullable=False,
            index=True,
        ),
    )

    shipment_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(pg.UUID, nullable=True, index=True),
    )
    # vendor's uid for HOLD/REFUND, dispatcher's uid for RELEASE/COMMISSION
    user_id: uuid.UUID = Field(sa_column=Column(pg.UUID, nullable=False, index=True))

    type: TransactionType = Field(
        sa_column=Column(pg.ENUM(TransactionType, name="transactiontype"), nullable=False)
    )
    amount: int = Field(sa_column=Column(pg.INTEGER, nullable=False))  # kobo, always positive

    status: TransactionStatus = Field(
        default=TransactionStatus.PENDING,
        sa_column=Column(
            pg.ENUM(TransactionStatus, name="transactionstatus"),
            nullable=False,
            server_default=TransactionStatus.PENDING.value,
        ),
    )

    # Paystack transaction reference (for HOLD) or transfer reference (for RELEASE)
    paystack_reference: Optional[str] = Field(
        default=None, sa_column=Column(pg.VARCHAR, nullable=True, unique=True)
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=False),
    )
