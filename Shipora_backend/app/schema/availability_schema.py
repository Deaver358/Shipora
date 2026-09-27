import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AvailabilityCreate(BaseModel):
    operating_state: str
    operating_city: str
    service_area: str
    vehicle_type: str
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    note: Optional[str] = None


class AvailabilityResponse(BaseModel):
    availability_id: uuid.UUID
    dispatcher_id: uuid.UUID
    operating_state: str
    operating_city: str
    service_area: str
    vehicle_type: str
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    is_active: bool
    note: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
