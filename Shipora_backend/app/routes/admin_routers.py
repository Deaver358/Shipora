import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_config import session
from app.core.dependencies import get_this_user, RoleChecker
from app.models.user_model import User
from app.models.dispatcher_model import Dispatcher, VerificationStatus
from app.models.both_roles_model import BothRoles, VerificationStatus as BothVerificationStatus
from app.models.shipment_model import Shipment, ShipmentStatus
from app.schema.shipment_schema import ShipmentDetailResponse, AdminDisputeResolution
from app.services.shipment_services import ShipmentService
from app.services.notification_services import NotificationService
from app.models.notification_model import NotificationType
from app.utils.config import settings

router = APIRouter()
shipment_service = ShipmentService()
notification_service = NotificationService()
admin_required = RoleChecker(["admin"])


@router.get("/vehicle-kyc")
async def pending_vehicle_kyc(_: bool = Depends(admin_required), session: AsyncSession = Depends(session)):
    dispatchers = await session.execute(select(Dispatcher).where(Dispatcher.vehicle_verification_status == VerificationStatus.PENDING))
    both = await session.execute(select(BothRoles).where(BothRoles.vehicle_verification_status == BothVerificationStatus.PENDING))
    return {
        "dispatchers": [d.model_dump() for d in dispatchers.scalars().all()],
        "both_roles": [b.model_dump() for b in both.scalars().all()],
    }


@router.post("/vehicle-kyc/{profile_type}/{profile_id}/approve")
async def approve_vehicle(profile_type: str, profile_id: uuid.UUID, _: bool = Depends(admin_required), session: AsyncSession = Depends(session)):
    if profile_type == "dispatcher":
        result = await session.execute(select(Dispatcher).where(Dispatcher.dispatcher_id == profile_id))
        row = result.scalar_one_or_none()
        enum = VerificationStatus
    elif profile_type == "both":
        result = await session.execute(select(BothRoles).where(BothRoles.both_roles_id == profile_id))
        row = result.scalar_one_or_none()
        enum = BothVerificationStatus
    else:
        raise HTTPException(400, "Invalid profile type.")
    if not row:
        raise HTTPException(404, "Profile not found.")
    row.vehicle_verification_status = enum.VERIFIED
    row.vehicle_rejection_reason = None
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    await session.commit()
    await notification_service.notify(
        user_id=row.user_id, type=NotificationType.KYC, title="Vehicle documents approved",
        message="Your vehicle documents were approved. You can now apply to open jobs.", session=session,
    )
    return {"message": "Vehicle KYC approved."}


@router.post("/vehicle-kyc/{profile_type}/{profile_id}/reject")
async def reject_vehicle(profile_type: str, profile_id: uuid.UUID, reason: str, _: bool = Depends(admin_required), session: AsyncSession = Depends(session)):
    if profile_type == "dispatcher":
        result = await session.execute(select(Dispatcher).where(Dispatcher.dispatcher_id == profile_id))
        row = result.scalar_one_or_none()
        enum = VerificationStatus
    elif profile_type == "both":
        result = await session.execute(select(BothRoles).where(BothRoles.both_roles_id == profile_id))
        row = result.scalar_one_or_none()
        enum = BothVerificationStatus
    else:
        raise HTTPException(400, "Invalid profile type.")
    if not row:
        raise HTTPException(404, "Profile not found.")
    row.vehicle_verification_status = enum.REJECTED
    row.vehicle_rejection_reason = reason
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    await session.commit()
    await notification_service.notify(
        user_id=row.user_id, type=NotificationType.KYC, title="Vehicle documents rejected",
        message=f"Your vehicle documents were rejected: {reason}. Please re-upload corrected documents.", session=session,
    )
    return {"message": "Vehicle KYC rejected."}


@router.get("/disputes", response_model=list[ShipmentDetailResponse])
async def list_disputes(_: bool = Depends(admin_required), session: AsyncSession = Depends(session)):
    result = await session.execute(select(Shipment).where(Shipment.status == ShipmentStatus.DISPUTED).order_by(Shipment.updated_at.desc()))
    return result.scalars().all()


@router.post("/disputes/{shipment_id}/resolve", response_model=ShipmentDetailResponse)
async def resolve_dispute(shipment_id: uuid.UUID, data: AdminDisputeResolution, _: bool = Depends(admin_required), session: AsyncSession = Depends(session)):
    shipment = await shipment_service._get(shipment_id, session)
    if shipment.status != ShipmentStatus.DISPUTED:
        raise HTTPException(400, "Shipment is not disputed.")
    if data.action == "refund":
        await shipment_service._complete_and_refund_dispute(shipment, session)
    else:
        await shipment_service._complete_and_release(shipment, session)
        shipment.dispute_resolution = "release"
        shipment.dispute_resolved_at = datetime.now(timezone.utc)
        if data.note:
            shipment.note = f"{shipment.note or ''}\nAdmin: {data.note}".strip()
        session.add(shipment)
        await session.commit()
        await session.refresh(shipment)
    return shipment
