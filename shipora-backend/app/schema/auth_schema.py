from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime


class SignUpModel(BaseModel):
    fullname: str
    email: str
    password: str
    phone: str
    terms_accepted: bool
    terms_version: str

    model_config = ConfigDict(
        from_attributes=True
    )

class LoginModel(BaseModel):
    email: str
    password: str
