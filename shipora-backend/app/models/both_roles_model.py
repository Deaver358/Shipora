import uuid

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class BothRoles(SQLModel, table=True):
    __tablename__ = "both_roles"

    both_roles_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(
            pg.UUID,
            primary_key=True,
            unique=True,
            nullable=False,
            index=True,
        ),
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
    # VENDOR INFORMATION
    # =========================

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
        )
    )

    cac_number: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
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

    business_email: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
        )
    )

    business_address: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=False,
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