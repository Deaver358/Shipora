import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_this_user, RoleChecker
from app.core.session_config import session
from app.models.user_model import User
from app.schema.dispute_schema import (
    DisputeCreate,
    DisputeResponse,
    DisputeStatusUpdate,
    DisputeResolution,
)
from app.services.dispute_services import DisputeService


router = APIRouter()
dispute_service = DisputeService()

admin_required = RoleChecker(["admin"])


# ============================================================
# CREATE DISPUTE
# ============================================================

@router.post(
    "",
    response_model=DisputeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_dispute(
    data: DisputeCreate,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    return await dispute_service.create_dispute(
        user=user,
        shipment_id=data.shipment_id,
        reason=data.reason,
        description=data.description,
        evidence=data.evidence,
        session=session,
    )


# ============================================================
# USER'S DISPUTES
# ============================================================

@router.get(
    "/mine",
    response_model=list[DisputeResponse],
)
async def my_disputes(
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    return await dispute_service.get_user_disputes(
        user=user,
        session=session,
    )


# ============================================================
# ADMIN - LIST ALL DISPUTES
# IMPORTANT: MUST COME BEFORE /{dispute_id}
# ============================================================

@router.get(
    "/admin/all",
    response_model=list[DisputeResponse],
)
async def admin_list_disputes(
    _: bool = Depends(admin_required),
    session: AsyncSession = Depends(session),
):
    return await dispute_service.list_admin_disputes(
        session=session,
    )


# ============================================================
# ADMIN - UPDATE DISPUTE STATUS
# ============================================================

@router.patch(
    "/admin/{dispute_id}/status",
    response_model=DisputeResponse,
)
async def admin_update_dispute_status(
    dispute_id: uuid.UUID,
    data: DisputeStatusUpdate,
    _: bool = Depends(admin_required),
    session: AsyncSession = Depends(session),
):
    return await dispute_service.update_status(
        dispute_id=dispute_id,
        new_status=data.status,
        session=session,
    )


# ============================================================
# ADMIN - RESOLVE DISPUTE
# ============================================================

@router.post(
    "/admin/{dispute_id}/resolve",
    response_model=DisputeResponse,
)
async def admin_resolve_dispute(
    dispute_id: uuid.UUID,
    data: DisputeResolution,
    admin: User = Depends(get_this_user),
    _: bool = Depends(admin_required),
    session: AsyncSession = Depends(session),
):
    return await dispute_service.resolve_dispute(
        dispute_id=dispute_id,
        admin_user=admin,
        action=data.action,
        note=data.note,
        session=session,
    )


# ============================================================
# GET SINGLE DISPUTE
# IMPORTANT: MUST COME AFTER ALL STATIC ROUTES
# ============================================================

@router.get(
    "/{dispute_id}",
    response_model=DisputeResponse,
)
async def get_dispute(
    dispute_id: uuid.UUID,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    return await dispute_service.get_dispute(
        dispute_id=dispute_id,
        user=user,
        session=session,
    )