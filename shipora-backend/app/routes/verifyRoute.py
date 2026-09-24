from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.vendor_model import Vendor
from app.schema.role_schema import VendorCreate, VendorResponse, DispatcherCreate, DispatcherResponse, BothRolesCreate, BothRolesResponse
from app.core.session_config import session


from app.models.dispatcher_model import Dispatcher
from app.services.role_services import RoleService


vendor_router = APIRouter()

dispatcher_router = APIRouter()

both_router = APIRouter()

role_service = RoleService()



@both_router.post("verify", response_model=BothRolesResponse, status_code=status.HTTP_201_CREATED)
async def verify_dispatcher_and_vendor(data: BothRolesCreate, session: AsyncSession = Depends(session)):
    verify_roles = await role_service.create_both_roles(data=data, session=session)
    if not verify_roles:
        raise HTTPException(
            detail={
                'message':f'{verify_roles}'
            },
            status_code=status.HTTP_400_BAD_REQUEST
        )

    return VendorResponse.model_validate(verify_roles)



# ============================================================
# CREATE / VERIFY VENDOR
# ============================================================
@vendor_router.post("/verify", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def verify_and_create_vendor(data: VendorCreate,session: AsyncSession = Depends(session)):
    verify_role = await role_service.create_vendor(data=data, session=session)

    if not verify_role:
        raise HTTPException(
            detail={
                'message':f'{verify_role}'
            },
            status_code=status.HTTP_400_BAD_REQUEST
        )

    return VendorResponse.model_validate(verify_role)



# ============================================================
# CREATE + VERIFY DISPATCHER
# ============================================================
@dispatcher_router.post(
    "/verify",
    response_model=DispatcherResponse,
    status_code=status.HTTP_201_CREATED,
)
async def verify_and_create_dispatcher(
    data: DispatcherCreate,
    session: AsyncSession = Depends(session),
):

    verify_role = await role_service.create_dispatcher(data=data, session=session)

    if not verify_role:
        raise HTTPException(
            detail={
                'message':f'{verify_role}'
            },
            status_code=status.HTTP_400_BAD_REQUEST
        )

    return DispatcherResponse.model_validate(verify_role)

    