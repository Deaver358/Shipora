import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List

from sqlalchemy import Column
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field


class ShipmentStatus(str, Enum):
    PENDING_PAYMENT = "pending_payment"
    OPEN = "open"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    HELD = "held"
    RELEASED = "released"
    REFUNDED = "refunded"


class Shipment(SQLModel, table=True):
    __tablename__ = "shipments"

    shipment_id: uuid.UUID = Field(default_factory=uuid.uuid4, sa_column=Column(pg.UUID, primary_key=True, unique=True, nullable=False, index=True))
    vendor_id: uuid.UUID = Field(sa_column=Column(pg.UUID, nullable=False, index=True))
    dispatcher_id: Optional[uuid.UUID] = Field(default=None, sa_column=Column(pg.UUID, nullable=True, index=True))

    item_name: str = Field(sa_column=Column(pg.VARCHAR, nullable=False))
    description: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    media: Optional[List[str]] = Field(default=None, sa_column=Column(pg.JSONB, nullable=True))
    pickup: str = Field(sa_column=Column(pg.VARCHAR, nullable=False))
    destination: str = Field(sa_column=Column(pg.VARCHAR, nullable=False))

    recipient_name: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    recipient_phone: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    recipient_address: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    recipient_city: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    recipient_region: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    recipient_postal_code: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    recipient_lat: Optional[float] = Field(default=None, sa_column=Column(pg.DOUBLE_PRECISION, nullable=True))
    recipient_lng: Optional[float] = Field(default=None, sa_column=Column(pg.DOUBLE_PRECISION, nullable=True))

    vehicle_preference: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))
    note: Optional[str] = Field(default=None, sa_column=Column(pg.VARCHAR, nullable=True))

    delivery_fee: int = Field(sa_column=Column(pg.INTEGER, nullable=False))
    service_fee: int = Field(default=0, sa_column=Column(pg.INTEGER, nullable=False))
    platform_commission: int = Field(default=0, sa_column=Column(pg.INTEGER, nullable=False))
    payment_by: str = Field(default="vendor", sa_column=Column(pg.VARCHAR, nullable=False))

    status: ShipmentStatus = Field(
        default=ShipmentStatus.PENDING_PAYMENT,
        sa_column=Column(
            pg.ENUM(
                ShipmentStatus,
                name="shipmentstatus",
                values_callable=lambda enum_class: [
                    member.value for member in enum_class
                ],
            ),
            nullable=False,
            server_default=ShipmentStatus.PENDING_PAYMENT.value,
        ),
    )

    payment_status: PaymentStatus = Field(
        default=PaymentStatus.UNPAID,
        sa_column=Column(
            pg.ENUM(
                PaymentStatus,
                name="paymentstatus",
                values_callable=lambda enum_class: [
                    member.value for member in enum_class
                ],
            ),
            nullable=False,
            server_default=PaymentStatus.UNPAID.value,
        ),
    )

    tracking_number: str = Field(
        default_factory=lambda: f"SHP-{uuid.uuid4().hex[:10].upper()}",
        sa_column=Column(pg.VARCHAR, nullable=False, unique=True, index=True),
    )

    public_token: str = Field(
        default_factory=lambda: uuid.uuid4().hex,
        sa_column=Column(pg.VARCHAR, nullable=False, unique=True, index=True),
    )

    delivered_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=True),
    )

    auto_release_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=True),
    )

    completed_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=True),
    )

    current_location: Optional[str] = Field(
        default=None,
        sa_column=Column(pg.VARCHAR, nullable=True),
    )

    current_lat: Optional[float] = Field(
        default=None,
        sa_column=Column(pg.DOUBLE_PRECISION, nullable=True),
    )

    current_lng: Optional[float] = Field(
        default=None,
        sa_column=Column(pg.DOUBLE_PRECISION, nullable=True),
    )

    location_updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=True),
    )

    dispute_reason: Optional[str] = Field(
        default=None,
        sa_column=Column(pg.VARCHAR, nullable=True),
    )

    dispute_resolution: Optional[str] = Field(
        default=None,
        sa_column=Column(pg.VARCHAR, nullable=True),
    )

    dispute_resolved_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=True),
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=False),
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=False),
    )