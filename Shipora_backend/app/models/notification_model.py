import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, Enum as SQLEnum
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class NotificationType(str, Enum):
    SHIPMENT = "shipment"
    DISPATCH = "dispatch"
    PAYMENT = "payment"
    APPLICATION = "application"
    DISPUTE = "dispute"
    KYC = "kyc"
    RATING = "rating"
    SYSTEM = "system"


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    notification_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(
            pg.UUID,
            primary_key=True,
            unique=True,
            nullable=False,
            index=True,
        ),
    )

    # who this notification is for
    user_id: uuid.UUID = Field(
        sa_column=Column(
            pg.UUID,
            nullable=False,
            index=True,
        )
    )

    type: NotificationType = Field(
        default=NotificationType.SYSTEM,
        sa_column=Column(
            SQLEnum(
                NotificationType,
                name="notificationtype",
                values_callable=lambda enum_class: [
                    member.value for member in enum_class
                ],
            ),
            nullable=False,
            server_default="system",
        ),
    )

    title: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    message: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    # optional deep-link target so the frontend can route
    # to the right shipment/dispute/etc.
    shipment_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(
            pg.UUID,
            nullable=True,
        ),
    )

    read: bool = Field(
        default=False,
        sa_column=Column(
            pg.BOOLEAN,
            nullable=False,
            server_default="false",
        ),
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
        ),
    )