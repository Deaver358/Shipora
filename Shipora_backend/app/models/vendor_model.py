import uuid

from datetime import date, datetime, timezone

from enum import Enum

from sqlalchemy import Column, String, Enum as SQLEnum
import sqlalchemy.dialects.postgresql as pg

from sqlmodel import SQLModel, Field
from typing import Optional


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    REVIEW_REQUIRED = "review_required"


class Vendor(SQLModel, table=True):
    __tablename__ = "vendors"

    vendor_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(
            pg.UUID,
            primary_key=True,
            unique=True,
            nullable=False,
            index=True,
        ),
    )

    # links this profile back to the account that verified it —
    # every shipment/application/rating query resolves through this
    user_id: uuid.UUID = Field(
        sa_column=Column(pg.UUID, nullable=False, unique=True, index=True)
    )

    # Personal Information
    first_name: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    middle_name: Optional[str] = Field(
        default=None,
        sa_column=Column(
            pg.VARCHAR,
            nullable=True,
        )
    )

    surname: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    date_of_birth: Optional[date] = Field(
        default=None,
        sa_column=Column(
            pg.DATE,
            nullable=True,
        ),
    )

    phone: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
            unique=True,
            index=True,
        )
    )

    email: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
            unique=True,
            index=True,
        )
    )

    nationality: str = Field(
        default="Nigerian",
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    state: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    lga: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    address: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    nin: Optional[str] = Field(
        default=None,
        sa_column=Column(
            pg.VARCHAR,
            nullable=True,
            unique=True,
            index=True,
        )
    )

    # Vendor / Business Information
    vendor_type: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    business_name: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
            index=True,
        )
    )

    cac_number: Optional[str] = Field(
        default=None,
        sa_column=Column(
            pg.VARCHAR,
            nullable=True,
            unique=True,
            index=True,
        )
    )

    business_type: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    business_phone: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    business_email: Optional[str] = Field(
        default=None,
        sa_column=Column(
            pg.VARCHAR,
            nullable=True,
        )
    )

    business_address: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    # NIN + CAC are both auto-checked via the verification provider at signup
    nin_verification_status: VerificationStatus = Field(
        default=VerificationStatus.PENDING,
        sa_column=Column(
            SQLEnum(
    VerificationStatus,
    name="vendorninverificationstatus",
    values_callable=lambda enum_class: [
        member.value for member in enum_class
    ],
),
            nullable=False,
            server_default=VerificationStatus.PENDING.value,
        ),
    )
    nin_verification_ref: Optional[str] = Field(
        default=None, sa_column=Column(pg.VARCHAR, nullable=True)
    )
    cac_verification_status: VerificationStatus = Field(
        default=VerificationStatus.PENDING,
        sa_column=Column(
            SQLEnum(
    VerificationStatus,
    name="cacverificationstatus",
    values_callable=lambda enum_class: [
        member.value for member in enum_class
    ],
),
            nullable=False,
            server_default=VerificationStatus.PENDING.value,
        ),
    )
    cac_verification_ref: Optional[str] = Field(
        default=None, sa_column=Column(pg.VARCHAR, nullable=True)
    )

    # cached from Rating rows — updated whenever a new rating for this vendor lands
    average_rating: float = Field(
        default=0.0, sa_column=Column(pg.FLOAT, nullable=False, server_default="0")
    )
    total_ratings: int = Field(
        default=0, sa_column=Column(pg.INTEGER, nullable=False, server_default="0")
    )

    # payout destination — needed now that vendors can also withdraw
    # unused Shipora wallet balance (refunds, unspent top-ups) to their bank
    bank_code: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    account_number: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    account_name: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    paystack_recipient_code: Optional[str] = Field(
        default=None, sa_column=Column(pg.VARCHAR, nullable=True)
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
        ),
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
        ),
    )

