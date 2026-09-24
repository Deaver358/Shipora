import uuid

from datetime import date, datetime, timezone

from sqlalchemy import Column, String
import sqlalchemy.dialects.postgresql as pg

from sqlmodel import SQLModel, Field
from typing import Optional


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