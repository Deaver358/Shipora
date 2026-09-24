from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime


class DispatcherCreate(BaseModel):
    first_name: str
    middle_name: str
    surname: str
    date_of_birth: str
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: str
    dispatch_name: str
    operating_state: str
    operating_city: str
    vehicle_type: str
    vehicle_registration: str
    is_driver: str
    licence_number: str

    model_config = ConfigDict(
        from_attributes=True
    )


class DispatcherResponse(BaseModel):
    dispatcher_id: uuid.UUID
    first_name: str
    middle_name: str
    surname: str
    date_of_birth: str
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: str
    dispatch_name: str
    operating_state: str
    operating_city: str
    vehicle_type: str
    vehicle_registration: str
    is_driver: bool
    licence_number: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class VendorCreate(BaseModel):
    first_name: str
    middle_name: str
    surname: str
    date_of_birth: str
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: str
    vendor_type: str
    business_ame: str
    cac_number: str
    business_type: str
    business_phone: str
    business_email: str
    business_address: str

    model_config = ConfigDict(
        from_attributes=True
    )


class VendorResponse(BaseModel):
    vendor_id: uuid.UUID
    first_name: str
    middle_name: str
    surname: str
    date_of_birth: str
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: str
    vendor_type: str
    business_ame: str
    cac_number: str
    business_type: str
    business_phone: str
    business_email: str
    business_address: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class BothRolesCreate(BaseModel):
    first_name: str
    middle_name: str
    surname: str
    date_of_birth: str
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: str
    vendor_type: str
    business_tame: str
    cac_number: str
    business_type: str
    business_phone: str
    business_email: str
    business_address: str
    dispatch_name: str
    operating_state: str
    operating_city: str
    service_area: str
    vehicle_type: str
    vehicle_registration: str
    is_driver: bool
    licence_number: str

    model_config = ConfigDict(
        from_attributes=True
    )


class BothRolesCreate(BaseModel):

    first_name: str
    middle_name: str
    surname: str
    date_of_birth: str
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: str
    vendor_type: str
    business_name: str
    cac_number: str
    business_type: str
    business_phone: str
    business_email: str
    business_address: str
    dispatch_name: str
    operating_state: str
    operating_city: str
    service_area: str
    vehicle_type: str
    vehicle_registration: str
    is_driver: bool
    licence_number: str

    model_config = ConfigDict(
        from_attributes=True
    )


class BothRolesResponse(BaseModel):
    both_roles_id: uuid.UUID
    first_name: str
    middle_name: str
    surname: str
    date_of_birth: str
    phone: str
    email: str
    nationality: str
    state: str
    lga: str
    address: str
    nin: str
    vendor_type: str
    business_name: str
    cac_number: str
    business_type: str
    business_phone: str
    business_email: str
    business_address: str
    dispatch_name: str
    operating_state: str
    operating_city: str
    service_area: str
    vehicle_type: str
    vehicle_registration: str
    is_driver: bool
    licence_number: str

    model_config = ConfigDict(
        from_attributes=True
    )