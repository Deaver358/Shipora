from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import List, Optional
from ..models.user_model import UserRole


class AbstractUserDataModel(BaseModel):

    uid: uuid.UUID
    email: str
    fullname: str
    # Admin and Google accounts are created without a phone number
    phone: Optional[str] = None
    role: UserRole
    account_verified: bool
    status: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

class UserDataModel(BaseModel):

    uid: uuid.UUID
    email: str
    fullname: str
    phone: Optional[str] = None
    avatar_url: str | None = None
    role: UserRole
    account_verified: bool
    verified: bool
    status: str
    terms_accepted: Optional[bool] = None
    terms_version: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
            from_attributes=True
    )
