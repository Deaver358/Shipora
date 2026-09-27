import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class DispatchAvailability(SQLModel, table=True):
    __tablename__ = "dispatch_availability"

    availability_id: uuid.UUID = Field(default_factory=uuid.uuid4, sa_column=Column(pg.UUID, primary_key=True, unique=True, nullable=False, index=True))
    dispatcher_id: uuid.UUID = Field(sa_column=Column(pg.UUID, nullable=False, index=True))
    operating_state: str = Field(sa_column=Column(pg.VARCHAR, nullable=False, index=True))
    operating_city: str = Field(sa_column=Column(pg.VARCHAR, nullable=False, index=True))
    service_area: str = Field(sa_column=Column(pg.VARCHAR, nullable=False))
    vehicle_type: str = Field(sa_column=Column(pg.VARCHAR, nullable=False))
    available_from: Optional[datetime] = Field(default=None, sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=True))
    available_until: Optional[datetime] = Field(default=None, sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=True))
    is_active: bool = Field(default=True, sa_column=Column(pg.BOOLEAN, nullable=False, server_default="true", index=True))
    note: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=False))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=False))
