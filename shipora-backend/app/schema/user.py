from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import List
from ..models.user_model import UserRole


class AbstractUserDataModel(BaseModel):

    uid: uuid.UUID
    email: str
    fullname: str
    phone: str
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
    phone: str
    role: UserRole
    account_verified: bool
    verified: bool
    status: str
    terms_accepted: bool
    terms_version: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
            from_attributes=True
    )