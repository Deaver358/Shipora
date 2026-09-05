from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime


class SignUpModel(BaseModel):
    fullname: str
    email: str
    password: str

    model_config = ConfigDict(
        from_attributes=True
    )

class LoginModel(BaseModel):
    email: str
    password: str
