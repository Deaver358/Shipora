import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from ..models.notification_model import NotificationType


class NotificationResponse(BaseModel):
    notification_id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    shipment_id: Optional[uuid.UUID] = None
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadCountResponse(BaseModel):
    unread_count: int
