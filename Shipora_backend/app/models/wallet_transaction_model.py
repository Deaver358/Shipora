import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, Enum as SQLEnum
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class TransactionType(str, Enum):
    TOPUP = "topup"
    ESCROW_HOLD = "escrow_hold"
    ESCROW_RELEASE = "escrow_release"
    REFUND = "refund"
    PLATFORM_COMMISSION = "platform_commission"
    WITHDRAWAL = "withdrawal"


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
        sa_column=Column(
            pg.UUID,
            nullable=True,
            index=True,
        ),
    )

    # Vendor's UID for HOLD/REFUND, dispatcher's UID for RELEASE/COMMISSION
    user_id: uuid.UUID = Field(
        sa_column=Column(
            pg.UUID,
            nullable=False,
            index=True,
        )
    )

    type: TransactionType = Field(
        sa_column=Column(
            SQLEnum(
                TransactionType,
                name="transactiontype",
                values_callable=lambda enum_class: [
                    member.value for member in enum_class
                ],
            ),
            nullable=False,
        )
    )

    amount: int = Field(
        sa_column=Column(
            pg.INTEGER,
            nullable=False,
        )
    )  # kobo, always positive

    status: TransactionStatus = Field(
        default=TransactionStatus.PENDING,
        sa_column=Column(
            SQLEnum(
                TransactionStatus,
                name="transactionstatus",
                values_callable=lambda enum_class: [
                    member.value for member in enum_class
                ],
            ),
            nullable=False,
            server_default="pending",
        ),
    )

    # Paystack transaction reference (for HOLD) or transfer reference (for RELEASE)
    paystack_reference: Optional[str] = Field(
        default=None,
        sa_column=Column(
            pg.VARCHAR,
            nullable=True,
            unique=True,
        ),
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
        ),
    )