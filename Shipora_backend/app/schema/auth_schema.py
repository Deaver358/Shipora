from pydantic import BaseModel, ConfigDict, Field
import uuid
from datetime import datetime


class SignUpModel(BaseModel):
    fullname: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=7, max_length=20)
    terms_accepted: bool
    terms_version: str

    model_config = ConfigDict(
        from_attributes=True
    )

class LoginModel(BaseModel):
    email: str
    password: str


class EmailRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str
