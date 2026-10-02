import uuid

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_config import session
from app.core.dependencies import RoleChecker

from app.models.dispatcher_model import (
    Dispatcher,
    VerificationStatus as DispatcherVerificationStatus,
)
from app.models.both_roles_model import (
    BothRoles,
    VerificationStatus as BothVerificationStatus,
)
from app.models.vendor_model import (
    Vendor,
    VerificationStatus as VendorVerificationStatus,
)

from app.models.shipment_model import Shipment, ShipmentStatus
from app.schema.shipment_schema import (
    ShipmentDetailResponse,
    AdminDisputeResolution,
)

from app.services.shipment_services import ShipmentService
from app.services.notification_services import NotificationService
from app.services.role_services import RoleService

from app.models.notification_model import NotificationType


router = APIRouter()

shipment_service = ShipmentService()
notification_service = NotificationService()
role_service = RoleService()

admin_required = RoleChecker(["admin"])


# ============================================================
# HELPERS
# ============================================================

async def _get_profile(
    profile_type: str,
    profile_id: uuid.UUID,
    db: AsyncSession,
):
    """
    Return:
        (profile, verification_enum)
    """

    if profile_type == "vendor":
        result = await db.execute(
            select(Vendor).where(Vendor.vendor_id == profile_id)
        )
        row = result.scalar_one_or_none()
        return row, VendorVerificationStatus

    if profile_type == "dispatcher":
        result = await db.execute(
            select(Dispatcher).where(Dispatcher.dispatcher_id == profile_id)
        )
        row = result.scalar_one_or_none()
        return row, DispatcherVerificationStatus

    if profile_type == "both":
        result = await db.execute(
            select(BothRoles).where(BothRoles.both_roles_id == profile_id)
        )
        row = result.scalar_one_or_none()
        return row, BothVerificationStatus

    raise HTTPException(
        status_code=400,
        detail="Invalid profile type.",
    )


def _status_value(value):
    """
    Convert enum status into a frontend-friendly string.
    """
    if value is None:
        return None

    return getattr(value, "value", str(value))


def _profile_payload(row, profile_type: str):
    """
    Return a controlled KYC response instead of exposing
    every database field.
    """

    payload = {
        "profile_type": profile_type,
        "profile_id": str(
            row.vendor_id
            if profile_type == "vendor"
            else row.dispatcher_id
            if profile_type == "dispatcher"
            else row.both_roles_id
        ),
        "user_id": str(row.user_id),

        "first_name": row.first_name,
        "middle_name": row.middle_name,
        "surname": row.surname,

        "email": row.email,
        "phone": row.phone,
        "date_of_birth": getattr(row, "date_of_birth", None),

        "nin": row.nin,
        "nin_verification_status": _status_value(
            row.nin_verification_status
        ),
        "nin_verification_ref": row.nin_verification_ref,

        "cac_number": getattr(row, "cac_number", None),
        "business_name": getattr(row, "business_name", None),
        "cac_verification_status": _status_value(
            getattr(row, "cac_verification_status", None)
        ),
        "cac_verification_ref": getattr(
            row,
            "cac_verification_ref",
            None,
        ),

        "vehicle_registration": getattr(
            row,
            "vehicle_registration",
            None,
        ),
        "vehicle_type": getattr(
            row,
            "vehicle_type",
            None,
        ),
        "vehicle_document_url": getattr(
            row,
            "vehicle_document_url",
            None,
        ),
        "vehicle_verification_status": _status_value(
            getattr(
                row,
                "vehicle_verification_status",
                None,
            )
        ),
        "vehicle_rejection_reason": getattr(
            row,
            "vehicle_rejection_reason",
            None,
        ),

        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }

    return payload


def _valid_document_type(profile_type: str, document_type: str):
    allowed = {
        "vendor": {"nin", "cac"},
        "dispatcher": {"nin", "vehicle"},
        "both": {"nin", "cac", "vehicle"},
    }

    if profile_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Invalid profile type.",
        )

    if document_type not in allowed[profile_type]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{document_type.upper()} verification is not "
                f"available for {profile_type} profiles."
            ),
        )


# ============================================================
# ADMIN KYC — LIST
# ============================================================

@router.get("/kyc")
async def list_kyc(
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(session),
):
    """
    Return all KYC profiles requiring attention.

    Includes:
        - pending
        - review_required
        - rejected
        - verified

    The frontend can filter these locally.
    """

    vendor_result = await db.execute(
        select(Vendor).order_by(Vendor.updated_at.desc())
    )

    dispatcher_result = await db.execute(
        select(Dispatcher).order_by(Dispatcher.updated_at.desc())
    )

    both_result = await db.execute(
        select(BothRoles).order_by(BothRoles.updated_at.desc())
    )

    applications = []

    for row in vendor_result.scalars().all():
        applications.append(
            _profile_payload(row, "vendor")
        )

    for row in dispatcher_result.scalars().all():
        applications.append(
            _profile_payload(row, "dispatcher")
        )

    for row in both_result.scalars().all():
        applications.append(
            _profile_payload(row, "both")
        )

    return {
        "applications": applications,
        "count": len(applications),
    }


# ============================================================
# ADMIN KYC — APPROVE
# ============================================================

@router.post(
    "/kyc/{profile_type}/{profile_id}/{document_type}/approve"
)
async def approve_kyc(
    profile_type: str,
    profile_id: uuid.UUID,
    document_type: str,
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(session),
):
    _valid_document_type(profile_type, document_type)

    row, enum = await _get_profile(
        profile_type,
        profile_id,
        db,
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Profile not found.",
        )

    # --------------------------------------------------------
    # NIN
    # --------------------------------------------------------

    if document_type == "nin":
        row.nin_verification_status = enum.VERIFIED

        message = (
            "Your NIN verification has been approved. "
            "Your Shipora identity verification is now complete."
        )

        title = "NIN verification approved"

    # --------------------------------------------------------
    # CAC
    # --------------------------------------------------------

    elif document_type == "cac":
        row.cac_verification_status = enum.VERIFIED

        message = (
            "Your CAC business verification has been approved."
        )

        title = "CAC verification approved"

    # --------------------------------------------------------
    # VEHICLE
    # --------------------------------------------------------

    elif document_type == "vehicle":
        row.vehicle_verification_status = enum.VERIFIED
        row.vehicle_rejection_reason = None

        message = (
            "Your vehicle documents were approved. "
            "You can now apply to available delivery jobs."
        )

        title = "Vehicle verification approved"

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported verification type.",
        )

    row.updated_at = datetime.now(timezone.utc)

    db.add(row)
    await db.commit()
    await db.refresh(row)

    await notification_service.notify(
        user_id=row.user_id,
        type=NotificationType.KYC,
        title=title,
        message=message,
        session=db,
    )

    return {
        "message": f"{document_type.upper()} verification approved.",
        "profile": _profile_payload(row, profile_type),
    }


# ============================================================
# ADMIN KYC — REJECT
# ============================================================

@router.post(
    "/kyc/{profile_type}/{profile_id}/{document_type}/reject"
)
async def reject_kyc(
    profile_type: str,
    profile_id: uuid.UUID,
    document_type: str,
    reason: str = "Verification could not be approved.",
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(session),
):
    _valid_document_type(profile_type, document_type)

    row, enum = await _get_profile(
        profile_type,
        profile_id,
        db,
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Profile not found.",
        )

    reason = reason.strip()

    if not reason:
        raise HTTPException(
            status_code=400,
            detail="A rejection reason is required.",
        )

    # --------------------------------------------------------
    # NIN
    # --------------------------------------------------------

    if document_type == "nin":
        row.nin_verification_status = enum.REJECTED

        title = "NIN verification rejected"

        message = (
            f"Your NIN verification was rejected. "
            f"Reason: {reason}. "
            f"Please review your information and retry verification."
        )

    # --------------------------------------------------------
    # CAC
    # --------------------------------------------------------

    elif document_type == "cac":
        row.cac_verification_status = enum.REJECTED

        title = "CAC verification rejected"

        message = (
            f"Your CAC verification was rejected. "
            f"Reason: {reason}. "
            f"Please review your business information and retry."
        )

    # --------------------------------------------------------
    # VEHICLE
    # --------------------------------------------------------

    elif document_type == "vehicle":
        row.vehicle_verification_status = enum.REJECTED
        row.vehicle_rejection_reason = reason

        title = "Vehicle verification rejected"

        message = (
            f"Your vehicle documents were rejected. "
            f"Reason: {reason}. "
            f"Please upload corrected documents."
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported verification type.",
        )

    row.updated_at = datetime.now(timezone.utc)

    db.add(row)
    await db.commit()
    await db.refresh(row)

    await notification_service.notify(
        user_id=row.user_id,
        type=NotificationType.KYC,
        title=title,
        message=message,
        session=db,
    )

    return {
        "message": f"{document_type.upper()} verification rejected.",
        "profile": _profile_payload(row, profile_type),
    }


# ============================================================
# ADMIN KYC — RETRY PROVIDER VERIFICATION
# ============================================================

@router.post(
    "/kyc/{profile_type}/{profile_id}/{document_type}/retry"
)
async def retry_kyc(
    profile_type: str,
    profile_id: uuid.UUID,
    document_type: str,
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(session),
):
    """
    Retry automatic provider verification.

    Supported:
        - NIN
        - CAC

    Vehicle remains manual-admin verification.
    """

    if document_type == "vehicle":
        raise HTTPException(
            status_code=400,
            detail=(
                "Vehicle verification is manual. "
                "Use approve or reject instead."
            ),
        )

    _valid_document_type(profile_type, document_type)

    row, enum = await _get_profile(
        profile_type,
        profile_id,
        db,
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Profile not found.",
        )

    # --------------------------------------------------------
    # RETRY NIN
    # --------------------------------------------------------

    if document_type == "nin":
        if not row.nin:
            raise HTTPException(
                status_code=400,
                detail="This profile has no NIN to verify.",
            )

        verification_status, reference = (
            await role_service.verify_nin(
                nin=row.nin,
                first_name=row.first_name,
                surname=row.surname,
            )
        )

        row.nin_verification_status = (
            enum(verification_status)
        )

        row.nin_verification_ref = reference

        title = "NIN verification retried"

        message = (
            f"Shipora retried your NIN verification. "
            f"Current result: {verification_status}."
        )

    # --------------------------------------------------------
    # RETRY CAC
    # --------------------------------------------------------

    elif document_type == "cac":
        if not getattr(row, "cac_number", None):
            raise HTTPException(
                status_code=400,
                detail="This profile has no CAC number to verify.",
            )

        verification_status, reference = (
            await role_service.verify_cac(
                cac_number=row.cac_number,
                business_name=row.business_name,
            )
        )

        row.cac_verification_status = (
            enum(verification_status)
        )

        row.cac_verification_ref = reference

        title = "CAC verification retried"

        message = (
            f"Shipora retried your CAC verification. "
            f"Current result: {verification_status}."
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported verification type.",
        )

    row.updated_at = datetime.now(timezone.utc)

    db.add(row)
    await db.commit()
    await db.refresh(row)

    await notification_service.notify(
        user_id=row.user_id,
        type=NotificationType.KYC,
        title=title,
        message=message,
        session=db,
    )

    return {
        "message": f"{document_type.upper()} verification retried.",
        "verification_status": verification_status,
        "verification_ref": reference,
        "profile": _profile_payload(row, profile_type),
    }


# ============================================================
# LEGACY VEHICLE KYC ENDPOINT
# ============================================================
# Kept temporarily so any existing frontend code does not
# immediately break while we move AdminKYC to /admin/kyc.

@router.get("/vehicle-kyc")
async def pending_vehicle_kyc(
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(session),
):
    dispatchers = await db.execute(
        select(Dispatcher).where(
            Dispatcher.vehicle_verification_status.in_(
                [
                    DispatcherVerificationStatus.PENDING,
                    DispatcherVerificationStatus.REVIEW_REQUIRED,
                ]
            )
        )
    )

    both = await db.execute(
        select(BothRoles).where(
            BothRoles.vehicle_verification_status.in_(
                [
                    BothVerificationStatus.PENDING,
                    BothVerificationStatus.REVIEW_REQUIRED,
                ]
            )
        )
    )

    return {
        "dispatchers": [
            d.model_dump()
            for d in dispatchers.scalars().all()
        ],
        "both_roles": [
            b.model_dump()
            for b in both.scalars().all()
        ],
    }


# ============================================================
# DISPUTES
# ============================================================

@router.get(
    "/disputes",
    response_model=list[ShipmentDetailResponse],
)
async def list_disputes(
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(session),
):
    result = await db.execute(
        select(Shipment)
        .where(Shipment.status == ShipmentStatus.DISPUTED)
        .order_by(Shipment.updated_at.desc())
    )

    return result.scalars().all()


@router.post(
    "/disputes/{shipment_id}/resolve",
    response_model=ShipmentDetailResponse,
)
async def resolve_dispute(
    shipment_id: uuid.UUID,
    data: AdminDisputeResolution,
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(session),
):
    shipment = await shipment_service._get(
        shipment_id,
        db,
    )

    if shipment.status != ShipmentStatus.DISPUTED:
        raise HTTPException(
            status_code=400,
            detail="Shipment is not disputed.",
        )

    if data.action == "refund":
        await shipment_service._complete_and_refund_dispute(
            shipment,
            db,
        )

    else:
        await shipment_service._complete_and_release(
            shipment,
            db,
        )

        shipment.dispute_resolution = "release"
        shipment.dispute_resolved_at = datetime.now(timezone.utc)

        if data.note:
            shipment.note = (
                f"{shipment.note or ''}\n"
                f"Admin: {data.note}"
            ).strip()

        db.add(shipment)
        await db.commit()
        await db.refresh(shipment)

    return shipment