import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import String, Column, Enum as SQLEnum
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class UserRole(str, Enum):
    DISPATCHER = "dispatcher"
    VENDOR = "vendor"
    ADMIN = "admin"
    USER = "user"


class User(SQLModel, table=True):
    __tablename__ = "users"

    uid: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(
            pg.UUID,
            unique=True,
            primary_key=True,
            nullable=False,
            index=True,
        ),
    )

    email: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            unique=True,
            nullable=False,
            index=True,
        )
    )

    phone: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            unique=True,
            nullable=True,
            index=True,
        )
    )

    avatar_url: str = Field(
        default=None,
        sa_column=Column(
            pg.VARCHAR,
            nullable=True,
        )
    )

    fullname: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            unique=False,
            nullable=False,
            index=True,
        )
    )

    password: str = Field(
        sa_column=Column(
            pg.VARCHAR,
            nullable=True,
        )
    )

    role: UserRole = Field(
        default=UserRole.USER,
        sa_column=Column(
            SQLEnum(
                UserRole,
                name="userrole",
                values_callable=lambda enum_class: [
                    member.value for member in enum_class
                ],
            ),
            nullable=False,
            server_default="user",
        ),
    )

    account_verified: bool = Field(
        default=False,
        sa_column=Column(
            pg.BOOLEAN,
            nullable=False,
            default=False,
        ),
    )

    verified: bool = Field(
        default=False,
        sa_column=Column(
            pg.BOOLEAN,
            nullable=False,
            default=False,
        ),
    )

    status: str = Field(
        default="active",
        sa_column=Column(
            String(255),
            nullable=False,
            default="active",
        ),
    )

    terms_accepted: bool = Field(
        sa_column=Column(
            pg.BOOLEAN,
            default=False,
        )
    )

    terms_version: str

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            pg.TIMESTAMP(timezone=True)
        ),
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            pg.TIMESTAMP(timezone=True)
        ),
    )