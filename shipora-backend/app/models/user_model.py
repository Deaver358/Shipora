import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Column

import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field, Column, Relationship
from typing import List 
from enum import Enum


class UserRole(str, Enum):

    DISPATCHER = "dispatcher"
    VENDOR = "vendor"
    ADMIN = "admin"
    USER = "user"
    

class User(SQLModel, table=True):
    __tablename__="users"
    uid: uuid.UUID = Field(default_factory=uuid.uuid4, sa_column=Column(
        pg.UUID,
        unique=True,
        primary_key=True,
        nullable=False,
        index=True,
    ))
    email: str = Field(sa_column=Column(
        pg.VARCHAR,
        unique=True,
        nullable=False,
        index=True,
    ))
    phone: str = Field(
        sa_column=Column(pg.VARCHAR, unique=True, nullable=True, index=True)
    )
    fullname: str = Field(sa_column=Column(
        pg.VARCHAR,
        unique=False,
        nullable=False,
        index=True,
    ))
    password: str = Field(sa_column=Column(
        pg.VARCHAR,
        nullable=True
    ))
    role: UserRole = Field(
        default=UserRole.USER,
        sa_column=Column(
            pg.ENUM(UserRole, name="userrole"),
            nullable=False,
            server_default=UserRole.USER.value,
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
    terms_accepted: bool = Field(sa_column=Column(
        pg.BOOLEAN,
        default=False
    ))
    terms_version: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(
        pg.TIMESTAMP(timezone=True)
    ))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(
        pg.TIMESTAMP(timezone=True)
    ))
    