from datetime import date, datetime
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator


TRUTHY = {"yes", "y", "true", "1", "on"}


def _blank_to_none(value):
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def _is_driver_text(value) -> str:
    """The frontend sends "yes"/"no" (or a boolean). Store a clean yes/no."""
    if isinstance(value, bool):
        return "yes" if value else "no"
    return "yes" if str(value or "").strip().lower() in TRUTHY else "no"


def _to_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    return str(value or "").strip().lower() in TRUTHY


def _date_to_str(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


class _RoleCreateBase(BaseModel):
    first_name: str = Field(min_length=1)
    middle_name: Optional[str] = None
    surname: str = Field(min_length=1)
    date_of_birth: Optional[str] = None
    phone: str = Field(min_length=7)
    email: str = Field(min_length=3)
    nationality: str = "Nigerian"
    state: str
    lga: str
    address: str
    # NIN is 11 digits
    nin: str = Field(pattern=r"^\d{11}$")

    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
    )

    @field_validator("middle_name", "date_of_birth", mode="before")
    @classmethod
    def _optional_text(cls, value):
        return _blank_to_none(value)

    @field_validator("email", mode="before")
    @classmethod
    def _email(cls, value):
        return str(value or "").strip().lower()

    @field_validator("nin", mode="before")
    @classmethod
    def _nin(cls, value):
        return "".join(str(value or "").split())


class DispatcherCreate(_RoleCreateBase):
    dispatch_name: str
    operating_state: str
    operating_city: str
    # Not on the dispatcher form yet — defaults to the operating city
    service_area: Optional[str] = None
    vehicle_type: str
    vehicle_registration: str = Field(min_length=2)
    is_driver: str = "no"
    licence_number: Optional[str] = None

    @field_validator("is_driver", mode="before")
    @classmethod
    def _driver(cls, value):
        return _is_driver_text(value)

    @field_validator("service_area", "licence_number", mode="before")
    @classmethod
    def _optional(cls, value):
        return _blank_to_none(value)

    @field_validator("vehicle_registration", mode="before")
    @classmethod
    def _plate(cls, value):
        return " ".join(str(value or "").strip().upper().split())


class DispatcherResponse(BaseModel):
    dispatcher_id: uuid.UUID
    first_name: str
    middle_name: Optional[str] = None
    surname: str
    date_of_birth: Optional[str] = None
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: Optional[str] = None
    dispatch_name: str
    operating_state: str
    operating_city: str
    service_area: Optional[str] = None
    vehicle_type: str
    vehicle_registration: str
    is_driver: bool
    licence_number: Optional[str] = None
    nin_verification_status: Optional[str] = None
    vehicle_verification_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

    @field_validator("is_driver", mode="before")
    @classmethod
    def _driver(cls, value):
        return _to_bool(value)

    @field_validator("date_of_birth", mode="before")
    @classmethod
    def _dob(cls, value):
        return _date_to_str(value)

    @field_validator("nin_verification_status", "vehicle_verification_status", mode="before")
    @classmethod
    def _status(cls, value):
        return getattr(value, "value", value)


class VendorCreate(_RoleCreateBase):
    vendor_type: str
    business_name: str = Field(min_length=1)
    cac_number: Optional[str] = None
    business_type: str
    business_phone: str
    business_email: Optional[str] = None
    business_address: str

    @field_validator("cac_number", "business_email", mode="before")
    @classmethod
    def _optional(cls, value):
        return _blank_to_none(value)

    @field_validator("cac_number", mode="after")
    @classmethod
    def _cac(cls, value):
        return value.upper() if value else value


class VendorResponse(BaseModel):
    vendor_id: uuid.UUID
    first_name: str
    middle_name: Optional[str] = None
    surname: str
    date_of_birth: Optional[str] = None
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: Optional[str] = None
    vendor_type: str
    business_name: str
    cac_number: Optional[str] = None
    business_type: str
    business_phone: str
    business_email: Optional[str] = None
    business_address: str
    nin_verification_status: Optional[str] = None
    cac_verification_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

    @field_validator("date_of_birth", mode="before")
    @classmethod
    def _dob(cls, value):
        return _date_to_str(value)

    @field_validator("nin_verification_status", "cac_verification_status", mode="before")
    @classmethod
    def _status(cls, value):
        return getattr(value, "value", value)


class BothRolesCreate(VendorCreate):
    dispatch_name: str
    operating_state: str
    operating_city: str
    service_area: Optional[str] = None
    vehicle_type: str
    vehicle_registration: str = Field(min_length=2)
    is_driver: bool = False
    licence_number: Optional[str] = None

    @field_validator("is_driver", mode="before")
    @classmethod
    def _driver(cls, value):
        return _to_bool(value)

    @field_validator("service_area", "licence_number", mode="before")
    @classmethod
    def _optional_dispatch(cls, value):
        return _blank_to_none(value)

    @field_validator("vehicle_registration", mode="before")
    @classmethod
    def _plate(cls, value):
        return " ".join(str(value or "").strip().upper().split())


class BothRolesResponse(BaseModel):
    both_roles_id: uuid.UUID
    first_name: str
    middle_name: Optional[str] = None
    surname: str
    date_of_birth: Optional[str] = None
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: Optional[str] = None
    vendor_type: str
    business_name: str
    cac_number: Optional[str] = None
    business_type: str
    business_phone: str
    business_email: Optional[str] = None
    business_address: str
    dispatch_name: str
    operating_state: str
    operating_city: str
    service_area: str
    vehicle_type: str
    vehicle_registration: str
    is_driver: bool
    licence_number: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )

    @field_validator("is_driver", mode="before")
    @classmethod
    def _driver(cls, value):
        return _to_bool(value)

    @field_validator("date_of_birth", mode="before")
    @classmethod
    def _dob(cls, value):
        return _date_to_str(value)
