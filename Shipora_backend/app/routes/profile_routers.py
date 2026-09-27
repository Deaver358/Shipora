from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_config import session
from app.core.dependencies import get_this_user
from app.models.user_model import User
from app.schema.profile_schema import (
    ProfileResponse,
    ProfileUpdateRequest,
    BankAccountUpdateRequest,
    BankAccountResponse,
    ChangePasswordRequest,
)
from app.services.profile_services import ProfileService

router = APIRouter()
profile_service = ProfileService()


@router.get("/banks")
async def list_banks():
    from app.utils import paystack
    banks = await paystack.list_banks()
    return [{"name": b["name"], "code": b["code"]} for b in banks]


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await profile_service.get_full_profile(user, session)


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdateRequest,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    await profile_service.update_basic_info(user.uid, data.fullname, data.phone, session)
    refreshed = await profile_service.get_full_profile(user, session)
    # reflect the just-saved name/phone even though `user` above is a stale snapshot
    if data.fullname:
        refreshed["fullname"] = data.fullname
    if data.phone:
        refreshed["phone"] = data.phone
    return refreshed


@router.patch("/bank-account", response_model=BankAccountResponse)
async def update_bank_account(
    data: BankAccountUpdateRequest,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    return await profile_service.update_bank_account(user.uid, data.bank_code, data.account_number, session)


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    await profile_service.change_password(user.uid, data.current_password, data.new_password, session)
    return {"message": "Password updated successfully."}
