import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, UniqueConstraint
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class ApplicationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class InitiatedBy(str, Enum):
    DISPATCHER = "dispatcher"
    VENDOR = "vendor"


class Application(SQLModel, table=True):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("shipment_id", "dispatcher_id", name="uq_application_shipment_dispatcher"),)

    application_id: uuid.UUID = Field(default_factory=uuid.uuid4, sa_column=Column(pg.UUID, primary_key=True, unique=True, nullable=False, index=True))
    shipment_id: uuid.UUID = Field(sa_column=Column(pg.UUID, nullable=False, index=True))
    dispatcher_id: uuid.UUID = Field(sa_column=Column(pg.UUID, nullable=False, index=True))
    proposed_fee: int = Field(sa_column=Column(pg.INTEGER, nullable=False))
    initiated_by: InitiatedBy = Field(sa_column=Column(pg.ENUM(InitiatedBy, name="applicationinitiator"), nullable=False))
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDING, sa_column=Column(pg.ENUM(ApplicationStatus, name="applicationstatus"), nullable=False, server_default=ApplicationStatus.PENDING.value))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=False))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=False))
