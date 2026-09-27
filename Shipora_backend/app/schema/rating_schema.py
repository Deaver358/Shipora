import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.rating_model import RaterRole


class RatingCreate(BaseModel):
    shipment_id: uuid.UUID
    score: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class RatingResponse(BaseModel):
    rating_id: uuid.UUID
    shipment_id: uuid.UUID
    rater_id: uuid.UUID
    rater_role: RaterRole
    rated_user_id: uuid.UUID
    score: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
