import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, CheckConstraint
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class RaterRole(str, Enum):
    VENDOR = "vendor"          # a vendor rating a dispatcher
    DISPATCHER = "dispatcher"  # a dispatcher rating a vendor


class Rating(SQLModel, table=True):
    __tablename__ = "ratings"
    __table_args__ = (
        CheckConstraint("score >= 1 AND score <= 5", name="rating_score_range"),
    )

    rating_id: uuid.UUID = Field(
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
        sa_column=Column(pg.UUID, nullable=False, index=True)
    )

    rater_id: uuid.UUID = Field(sa_column=Column(pg.UUID, nullable=False, index=True))
    rater_role: RaterRole = Field(
        sa_column=Column(pg.ENUM(RaterRole, name="raterrole"), nullable=False)
    )

    rated_user_id: uuid.UUID = Field(sa_column=Column(pg.UUID, nullable=False, index=True))

    score: int = Field(sa_column=Column(pg.SMALLINT, nullable=False))
    comment: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=False),
    )
