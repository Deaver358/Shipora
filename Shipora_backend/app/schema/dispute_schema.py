import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.dispute_model import DisputeAction, DisputeStatus


class DisputeCreate(BaseModel):
    shipment_id: uuid.UUID
    reason: str = Field(min_length=3, max_length=255)
    description: Optional[str] = None
    evidence: List[str] = Field(default_factory=list)


class DisputeResponse(BaseModel):
    dispute_id: uuid.UUID
    shipment_id: uuid.UUID
    tracking_number: str

    complainant_user_id: uuid.UUID

    vendor_id: uuid.UUID
    vendor_name: Optional[str] = None
    vendor_phone: Optional[str] = None
    vendor_email: Optional[str] = None

    dispatcher_id: Optional[uuid.UUID] = None
    dispatcher_name: Optional[str] = None
    dispatcher_phone: Optional[str] = None
    dispatcher_email: Optional[str] = None

    reason: str
    description: Optional[str] = None
    evidence: List[str]

    shipment_status: str
    payment_status: str
    delivery_fee: int

    status: DisputeStatus

    resolution_action: Optional[DisputeAction] = None
    resolution_note: Optional[str] = None
    resolved_by: Optional[uuid.UUID] = None
    resolved_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime


class DisputeStatusUpdate(BaseModel):
    status: DisputeStatus


class DisputeResolution(BaseModel):
    action: DisputeAction
    note: Optional[str] = None