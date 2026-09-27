import uuid
from typing import Optional
from pydantic import BaseModel, Field


class VendorProfileOut(BaseModel):
    business_name: str
    vendor_type: str
    nin_verified: bool
    cac_verified: bool
    average_rating: float
    total_ratings: int
    has_payout_account: bool = False
    account_name: Optional[str] = None


class DispatcherProfileOut(BaseModel):
    dispatch_name: str
    vehicle_type: str
    nin_verified: bool
    vehicle_verified: bool
    average_rating: float
    total_ratings: int
    has_payout_account: bool
    bank_code: Optional[str] = None
    bank_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    account_name: Optional[str] = None


class ProfileResponse(BaseModel):
    uid: uuid.UUID
    fullname: str
    email: str
    phone: str
    avatar_url: Optional[str] = None
    role: str
    vendor: Optional[VendorProfileOut] = None
    dispatcher: Optional[DispatcherProfileOut] = None


class ProfileUpdateRequest(BaseModel):
    fullname: Optional[str] = Field(default=None, min_length=2)
    phone: Optional[str] = Field(default=None, min_length=7)


class BankAccountUpdateRequest(BaseModel):
    bank_code: str
    account_number: str = Field(min_length=10, max_length=10)


class BankAccountResponse(BaseModel):
    bank_code: str
    account_number: str
    account_name: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
