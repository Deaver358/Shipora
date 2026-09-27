import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.application_model import ApplicationStatus, InitiatedBy


class ApplicationCreate(BaseModel):
    proposed_fee: Optional[float] = Field(default=None, gt=0)


class ApplicationResponse(BaseModel):
    application_id: uuid.UUID
    shipment_id: uuid.UUID
    dispatcher_id: uuid.UUID
    proposed_fee: int
    initiated_by: InitiatedBy
    status: ApplicationStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ApplicationWithDispatcherResponse(ApplicationResponse):
    dispatcher_name: str
    dispatcher_rating: float
    dispatcher_total_ratings: int
    dispatcher_vehicle: Optional[str] = None
