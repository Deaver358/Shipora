import uuid

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, String, Enum as SQLEnum
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    REVIEW_REQUIRED = "review_required"


class Dispatcher(SQLModel, table=True):
    __tablename__ = "dispatchers"

    dispatcher_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(
            pg.UUID,
            primary_key=True,
            unique=True,
            nullable=False,
            index=True,
        ),
    )

    user_id: uuid.UUID = Field(
        sa_column=Column(pg.UUID, nullable=False, unique=True, index=True)
    )

    # =========================
    # PERSONAL INFORMATION
    # =========================

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

    date_of_birth: Optional[str] = Field(
        default=None,
        sa_column=Column(
            pg.VARCHAR,
            nullable=True,
        )
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

    # =========================
    # DISPATCHER INFORMATION
    # =========================

    dispatch_name: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    operating_state: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    operating_city: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    service_area: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    vehicle_type: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    vehicle_registration: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
            unique=True,
            index=True,
        )
    )

    is_driver: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    licence_number: Optional[str] = Field(
        default=None,
        sa_column=Column(
            pg.VARCHAR,
            nullable=True,
            unique=True,
            index=True,
        )
    )

    # =========================
    # HYBRID KYC: NIN auto-checked via provider (instant), vehicle docs
    # go to manual admin review (this is what drives your existing
    # Pending / Review / Rejected pages)
    # =========================

    nin_verification_status: VerificationStatus = Field(
        default=VerificationStatus.PENDING,
        sa_column=Column(
            SQLEnum(
    VerificationStatus,
    name="ninverificationstatus",
    values_callable=lambda enum_class: [
        member.value for member in enum_class
    ],
),
            nullable=False,
            server_default=VerificationStatus.PENDING.value,
        ),
    )
    # provider's response id, kept for audit — not shown to the user
    nin_verification_ref: Optional[str] = Field(
        default=None, sa_column=Column(pg.VARCHAR, nullable=True)
    )

    vehicle_verification_status: VerificationStatus = Field(
        default=VerificationStatus.PENDING,
        sa_column=Column(
            SQLEnum(
    VerificationStatus,
    name="vehicleverificationstatus",
    values_callable=lambda enum_class: [
        member.value for member in enum_class
    ],
),
            nullable=False,
            server_default=VerificationStatus.PENDING.value,
        ),
    )
    # storage key/URL for the uploaded proof-of-ownership / vehicle photo (R2 bucket)
    vehicle_document_url: Optional[str] = Field(
        default=None, sa_column=Column(pg.VARCHAR, nullable=True)
    )
    vehicle_rejection_reason: Optional[str] = Field(
        default=None, sa_column=Column(pg.VARCHAR, nullable=True)
    )

    # =========================
    # PAYOUT — needed to release escrow via Paystack Transfers API
    # =========================

    bank_code: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    account_number: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    account_name: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    # returned by Paystack after registering a transfer recipient — cached so
    # we don't re-register on every payout
    paystack_recipient_code: Optional[str] = Field(
        default=None, sa_column=Column(pg.VARCHAR, nullable=True)
    )

    # cached from Rating rows — this is the number that drives the star
    # display on DispatchAvailability / FindDispatch / ShipmentDetails
    average_rating: float = Field(
        default=0.0, sa_column=Column(pg.FLOAT, nullable=False, server_default="0")
    )
    total_ratings: int = Field(
        default=0, sa_column=Column(pg.INTEGER, nullable=False, server_default="0")
    )

    # =========================
    # TIMESTAMPS
    # =========================

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



