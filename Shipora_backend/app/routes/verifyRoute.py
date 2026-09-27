from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.vendor_model import Vendor
from app.models.user_model import User
from app.schema.role_schema import VendorCreate, VendorResponse, DispatcherCreate, DispatcherResponse, BothRolesCreate, BothRolesResponse
from app.core.session_config import session
from app.core.dependencies import get_this_user


from app.models.dispatcher_model import Dispatcher
from app.services.role_services import RoleService


vendor_router = APIRouter()

dispatcher_router = APIRouter()

both_router = APIRouter()

role_service = RoleService()



@both_router.post("/verify", response_model=BothRolesResponse, status_code=status.HTTP_201_CREATED)
async def verify_dispatcher_and_vendor(
    data: BothRolesCreate,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    verify_roles = await role_service.create_both_roles(data=data, user_id=user.uid, session=session)
    return BothRolesResponse.model_validate(verify_roles)



# ============================================================
# CREATE / VERIFY VENDOR
# ============================================================
@vendor_router.post("/verify", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def verify_and_create_vendor(
    data: VendorCreate,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    verify_role = await role_service.create_vendor(data=data, user_id=user.uid, session=session)
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
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):

    verify_role = await role_service.create_dispatcher(data=data, user_id=user.uid, session=session)
    return DispatcherResponse.model_validate(verify_role)
