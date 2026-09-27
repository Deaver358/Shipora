import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.shipment_model import ShipmentStatus, PaymentStatus


class ShipmentCreate(BaseModel):
    item_name: str
    description: Optional[str] = None
    media: Optional[List[str]] = None
    pickup: str
    destination: str
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    payment_by: str = "vendor"
    delivery_amount: float = Field(gt=0)
    vehicle_preference: Optional[str] = None
    note: Optional[str] = None


class ShipmentJobResponse(BaseModel):
    shipment_id: uuid.UUID
    tracking_number: str
    item_name: str
    description: Optional[str] = None
    media: Optional[List[str]] = None
    pickup: str
    destination: str
    vehicle_preference: Optional[str] = None
    delivery_fee: int
    service_fee: int
    status: ShipmentStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ShipmentDetailResponse(BaseModel):
    shipment_id: uuid.UUID
    tracking_number: str
    public_token: str
    vendor_id: uuid.UUID
    dispatcher_id: Optional[uuid.UUID] = None
    item_name: str
    description: Optional[str] = None
    media: Optional[List[str]] = None
    pickup: str
    destination: str
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_address: Optional[str] = None
    recipient_city: Optional[str] = None
    recipient_region: Optional[str] = None
    recipient_postal_code: Optional[str] = None
    vehicle_preference: Optional[str] = None
    note: Optional[str] = None
    delivery_fee: int
    service_fee: int
    platform_commission: int
    payment_by: str
    status: ShipmentStatus
    payment_status: PaymentStatus
    delivered_at: Optional[datetime] = None
    auto_release_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    current_location: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    location_updated_at: Optional[datetime] = None
    dispute_reason: Optional[str] = None
    dispute_resolution: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DisputeRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=1000)


class CheckoutDetails(BaseModel):
    recipient_name: str = Field(min_length=2, max_length=120)
    recipient_phone: str = Field(min_length=5, max_length=40)
    recipient_address: str = Field(min_length=3, max_length=500)
    recipient_city: Optional[str] = None
    recipient_region: Optional[str] = None
    recipient_postal_code: Optional[str] = None
    recipient_lat: Optional[float] = None
    recipient_lng: Optional[float] = None


class LocationUpdate(BaseModel):
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class CancelRequest(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=1000)


class AdminDisputeResolution(BaseModel):
    action: str = Field(pattern="^(release|refund)$")
    note: Optional[str] = Field(default=None, max_length=1000)
