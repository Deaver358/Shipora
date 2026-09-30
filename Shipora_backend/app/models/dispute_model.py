import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

import sqlalchemy.dialects.postgresql as pg
from sqlalchemy import Column, Enum as SQLEnum
from sqlmodel import SQLModel, Field


class DisputeStatus(str, Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    IN_CONSIDERATION = "in_consideration"
    RESOLVED = "resolved"


class DisputeAction(str, Enum):
    RELEASE = "release"
    REFUND = "refund"


class Dispute(SQLModel, table=True):
    __tablename__ = "disputes"

    dispute_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(
            pg.UUID,
            primary_key=True,
            unique=True,
            nullable=False,
            index=True,
        ),
    )

    shipment_id: uuid.UUID = Field(
        sa_column=Column(
            pg.UUID,
            nullable=False,
            index=True,
        )
    )

    complainant_user_id: uuid.UUID = Field(
        sa_column=Column(
            pg.UUID,
            nullable=False,
            index=True,
        )
    )

    vendor_id: uuid.UUID = Field(
        sa_column=Column(
            pg.UUID,
            nullable=False,
            index=True,
        )
    )

    dispatcher_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(
            pg.UUID,
            nullable=True,
            index=True,
        )
    )

    reason: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    description: Optional[str] = Field(
        default=None,
        sa_column=Column(
            pg.TEXT,
            nullable=True,
        )
    )

    evidence: List[str] = Field(
        default_factory=list,
        sa_column=Column(
            pg.JSONB,
            nullable=False,
            server_default="[]",
        ),
    )

    status: DisputeStatus = Field(
        default=DisputeStatus.OPEN,
        sa_column=Column(
            SQLEnum(
                DisputeStatus,
                name="disputestatus",
                values_callable=lambda enum_class: [
                    member.value for member in enum_class
                ],
            ),
            nullable=False,
            server_default=DisputeStatus.OPEN.value,
            index=True,
        ),
    )

    resolution_action: Optional[DisputeAction] = Field(
        default=None,
        sa_column=Column(
            SQLEnum(
                DisputeAction,
                name="disputeaction",
                values_callable=lambda enum_class: [
                    member.value for member in enum_class
                ],
            ),
            nullable=True,
        ),
    )

    resolution_note: Optional[str] = Field(
        default=None,
        sa_column=Column(
            pg.TEXT,
            nullable=True,
        ),
    )

    resolved_by: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(
            pg.UUID,
            nullable=True,
        ),
    )

    resolved_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=True,
        ),
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
            index=True,
        ),
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
        ),
    )