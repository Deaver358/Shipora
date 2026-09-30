import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dispute_model import (
    Dispute,
    DisputeAction,
    DisputeStatus,
)
from app.models.shipment_model import Shipment, ShipmentStatus
from app.models.vendor_model import Vendor
from app.models.dispatcher_model import Dispatcher
from app.models.user_model import User


class DisputeService:

    # =========================================================
    # SHIPMENT
    # =========================================================

    async def _get_shipment(
        self,
        shipment_id: uuid.UUID,
        session: AsyncSession,
    ) -> Shipment:

        result = await session.execute(
            select(Shipment).where(
                Shipment.shipment_id == shipment_id
            )
        )

        shipment = result.scalar_one_or_none()

        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shipment not found.",
            )

        return shipment

    # =========================================================
    # VENDOR
    # =========================================================

    async def _get_vendor(
        self,
        vendor_id: uuid.UUID,
        session: AsyncSession,
    ):
        result = await session.execute(
            select(Vendor).where(
                Vendor.vendor_id == vendor_id
            )
        )

        return result.scalar_one_or_none()

    # =========================================================
    # DISPATCHER
    # =========================================================

    async def _get_dispatcher(
        self,
        dispatcher_id: uuid.UUID | None,
        session: AsyncSession,
    ):

        if not dispatcher_id:
            return None

        result = await session.execute(
            select(Dispatcher).where(
                Dispatcher.dispatcher_id == dispatcher_id
            )
        )

        return result.scalar_one_or_none()

    # =========================================================
    # AUTHORIZATION
    # =========================================================

    async def _user_can_dispute(
        self,
        user: User,
        shipment: Shipment,
        session: AsyncSession,
    ) -> bool:

        # Vendor / shipment owner
        vendor_result = await session.execute(
            select(Vendor).where(
                Vendor.vendor_id == shipment.vendor_id,
                Vendor.user_id == user.uid,
            )
        )

        if vendor_result.scalar_one_or_none():
            return True

        # Assigned dispatcher
        if shipment.dispatcher_id:

            dispatcher_result = await session.execute(
                select(Dispatcher).where(
                    Dispatcher.dispatcher_id == shipment.dispatcher_id,
                    Dispatcher.user_id == user.uid,
                )
            )

            if dispatcher_result.scalar_one_or_none():
                return True

        return False

    # =========================================================
    # CREATE DISPUTE
    # =========================================================

    async def create_dispute(
        self,
        user: User,
        shipment_id: uuid.UUID,
        reason: str,
        description: str | None,
        evidence: list[str],
        session: AsyncSession,
    ):

        shipment = await self._get_shipment(
            shipment_id,
            session,
        )

        # -----------------------------------------------------
        # Authorization
        # -----------------------------------------------------

        allowed = await self._user_can_dispute(
            user,
            shipment,
            session,
        )

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to dispute this shipment.",
            )

        # -----------------------------------------------------
        # Shipment must still be disputable
        # -----------------------------------------------------

        if shipment.status in {
            ShipmentStatus.CANCELLED,
            ShipmentStatus.COMPLETED,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This shipment can no longer be disputed.",
            )

        # -----------------------------------------------------
        # ONE ACTIVE DISPUTE PER SHIPMENT
        #
        # Active:
        # OPEN
        # UNDER_REVIEW
        # IN_CONSIDERATION
        # -----------------------------------------------------

        existing_result = await session.execute(
            select(Dispute).where(
                Dispute.shipment_id == shipment.shipment_id,
                Dispute.status.in_(
                    [
                        DisputeStatus.OPEN,
                        DisputeStatus.UNDER_REVIEW,
                        DisputeStatus.IN_CONSIDERATION,
                    ]
                ),
            )
        )

        existing = existing_result.scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This shipment already has an active dispute.",
            )

        # -----------------------------------------------------
        # Create dispute
        # -----------------------------------------------------

        dispute = Dispute(
            shipment_id=shipment.shipment_id,
            complainant_user_id=user.uid,
            vendor_id=shipment.vendor_id,
            dispatcher_id=shipment.dispatcher_id,
            reason=reason,
            description=description,
            evidence=evidence or [],
            status=DisputeStatus.OPEN,
        )

        # -----------------------------------------------------
        # Put shipment into dispute state
        # -----------------------------------------------------

        shipment.status = ShipmentStatus.DISPUTED
        shipment.dispute_reason = reason
        shipment.dispute_resolution = None
        shipment.dispute_resolved_at = None
        shipment.updated_at = datetime.now(timezone.utc)

        session.add(dispute)
        session.add(shipment)

        await session.commit()

        await session.refresh(dispute)

        return dispute

    # =========================================================
    # BUILD RESPONSE
    # =========================================================

    async def _build_response(
        self,
        dispute: Dispute,
        session: AsyncSession,
    ):

        shipment = await self._get_shipment(
            dispute.shipment_id,
            session,
        )

        vendor = await self._get_vendor(
            dispute.vendor_id,
            session,
        )

        dispatcher = await self._get_dispatcher(
            dispute.dispatcher_id,
            session,
        )

        # -----------------------------------------------------
        # Vendor user
        # -----------------------------------------------------

        vendor_user = None

        if vendor:

            vendor_user_result = await session.execute(
                select(User).where(
                    User.uid == vendor.user_id
                )
            )

            vendor_user = vendor_user_result.scalar_one_or_none()

        # -----------------------------------------------------
        # Dispatcher user
        # -----------------------------------------------------

        dispatcher_user = None

        if dispatcher:

            dispatcher_user_result = await session.execute(
                select(User).where(
                    User.uid == dispatcher.user_id
                )
            )

            dispatcher_user = dispatcher_user_result.scalar_one_or_none()

        # -----------------------------------------------------
        # Vendor name
        # -----------------------------------------------------

        vendor_name = None

        if vendor:

            vendor_name = " ".join(
                part
                for part in [
                    getattr(vendor, "first_name", None),
                    getattr(vendor, "middle_name", None),
                    getattr(vendor, "surname", None),
                ]
                if part
            )

        if not vendor_name and vendor_user:
            vendor_name = vendor_user.fullname

        # -----------------------------------------------------
        # Dispatcher name
        # -----------------------------------------------------

        dispatcher_name = None

        if dispatcher:

            dispatcher_name = " ".join(
                part
                for part in [
                    getattr(dispatcher, "first_name", None),
                    getattr(dispatcher, "middle_name", None),
                    getattr(dispatcher, "surname", None),
                ]
                if part
            )

        if not dispatcher_name and dispatcher_user:
            dispatcher_name = dispatcher_user.fullname

        # -----------------------------------------------------
        # Response
        # -----------------------------------------------------

        return {
            "dispute_id": dispute.dispute_id,
            "shipment_id": shipment.shipment_id,
            "tracking_number": shipment.tracking_number,

            "complainant_user_id": dispute.complainant_user_id,

            # Vendor / customer
            "vendor_id": dispute.vendor_id,
            "vendor_name": vendor_name,
            "vendor_phone": (
                getattr(vendor, "phone", None)
                or (
                    vendor_user.phone
                    if vendor_user
                    else None
                )
            ),
            "vendor_email": (
                getattr(vendor, "email", None)
                or (
                    vendor_user.email
                    if vendor_user
                    else None
                )
            ),

            # Dispatcher
            "dispatcher_id": dispute.dispatcher_id,
            "dispatcher_name": dispatcher_name,
            "dispatcher_phone": (
                getattr(dispatcher, "phone", None)
                or (
                    dispatcher_user.phone
                    if dispatcher_user
                    else None
                )
            ),
            "dispatcher_email": (
                getattr(dispatcher, "email", None)
                or (
                    dispatcher_user.email
                    if dispatcher_user
                    else None
                )
            ),

            # Complaint
            "reason": dispute.reason,
            "description": dispute.description,
            "evidence": dispute.evidence or [],

            # Shipment/payment
            "shipment_status": shipment.status.value,
            "payment_status": shipment.payment_status.value,
            "delivery_fee": shipment.delivery_fee,

            # Dispute
            "status": dispute.status.value,
            "resolution_action": (
                dispute.resolution_action.value
                if dispute.resolution_action
                else None
            ),
            "resolution_note": dispute.resolution_note,
            "resolved_by": dispute.resolved_by,
            "resolved_at": dispute.resolved_at,

            "created_at": dispute.created_at,
            "updated_at": dispute.updated_at,
        }

    # =========================================================
    # USER DISPUTES
    # =========================================================

    async def get_user_disputes(
        self,
        user: User,
        session: AsyncSession,
    ):

        vendor_result = await session.execute(
            select(Vendor.vendor_id).where(
                Vendor.user_id == user.uid
            )
        )

        vendor_id = vendor_result.scalar_one_or_none()

        dispatcher_result = await session.execute(
            select(Dispatcher.dispatcher_id).where(
                Dispatcher.user_id == user.uid
            )
        )

        dispatcher_id = dispatcher_result.scalar_one_or_none()

        # -----------------------------------------------------
        # IMPORTANT:
        # These must be OR conditions.
        #
        # A user can be:
        # - complainant
        # - vendor
        # - dispatcher
        # -----------------------------------------------------

        conditions = [
            Dispute.complainant_user_id == user.uid,
        ]

        if vendor_id:
            conditions.append(
                Dispute.vendor_id == vendor_id
            )

        if dispatcher_id:
            conditions.append(
                Dispute.dispatcher_id == dispatcher_id
            )

        result = await session.execute(
            select(Dispute)
            .where(
                or_(*conditions)
            )
            .order_by(
                Dispute.created_at.desc()
            )
        )

        disputes = result.scalars().all()

        return [
            await self._build_response(
                dispute,
                session,
            )
            for dispute in disputes
        ]

    # =========================================================
    # SINGLE DISPUTE
    # =========================================================

    async def get_dispute(
        self,
        dispute_id: uuid.UUID,
        user: User,
        session: AsyncSession,
    ):

        result = await session.execute(
            select(Dispute).where(
                Dispute.dispute_id == dispute_id
            )
        )

        dispute = result.scalar_one_or_none()

        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dispute not found.",
            )

        # -----------------------------------------------------
        # Admin can view everything
        # -----------------------------------------------------

        is_admin = (
            getattr(user.role, "value", user.role)
            == "admin"
        )

        if not is_admin:

            allowed = (
                dispute.complainant_user_id == user.uid
            )

            # Vendor
            if not allowed:

                vendor_result = await session.execute(
                    select(Vendor).where(
                        Vendor.vendor_id == dispute.vendor_id,
                        Vendor.user_id == user.uid,
                    )
                )

                allowed = (
                    vendor_result.scalar_one_or_none()
                    is not None
                )

            # Dispatcher
            if not allowed and dispute.dispatcher_id:

                dispatcher_result = await session.execute(
                    select(Dispatcher).where(
                        Dispatcher.dispatcher_id
                        == dispute.dispatcher_id,
                        Dispatcher.user_id == user.uid,
                    )
                )

                allowed = (
                    dispatcher_result.scalar_one_or_none()
                    is not None
                )

            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to view this dispute.",
                )

        return await self._build_response(
            dispute,
            session,
        )

    # =========================================================
    # ADMIN - ALL DISPUTES
    # =========================================================

    async def list_admin_disputes(
        self,
        session: AsyncSession,
    ):

        result = await session.execute(
            select(Dispute)
            .order_by(
                Dispute.created_at.desc()
            )
        )

        disputes = result.scalars().all()

        return [
            await self._build_response(
                dispute,
                session,
            )
            for dispute in disputes
        ]

    # =========================================================
    # ADMIN - UPDATE STATUS
    # =========================================================

    async def update_status(
        self,
        dispute_id: uuid.UUID,
        new_status: DisputeStatus,
        session: AsyncSession,
    ):

        result = await session.execute(
            select(Dispute).where(
                Dispute.dispute_id == dispute_id
            )
        )

        dispute = result.scalar_one_or_none()

        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dispute not found.",
            )

        # -----------------------------------------------------
        # Resolved disputes cannot be reopened
        # -----------------------------------------------------

        if dispute.status == DisputeStatus.RESOLVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A resolved dispute cannot be reopened through this action.",
            )

        # -----------------------------------------------------
        # Prevent manually changing directly to RESOLVED.
        #
        # Resolution must go through resolve_dispute()
        # so payment + shipment state are handled correctly.
        # -----------------------------------------------------

        if new_status == DisputeStatus.RESOLVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Use the resolution action to resolve a dispute.",
            )

        dispute.status = new_status
        dispute.updated_at = datetime.now(timezone.utc)

        session.add(dispute)

        await session.commit()
        await session.refresh(dispute)

        return await self._build_response(
            dispute,
            session,
        )

    # =========================================================
    # ADMIN - RESOLVE
    # =========================================================

    async def resolve_dispute(
        self,
        dispute_id: uuid.UUID,
        admin_user: User,
        action: DisputeAction,
        note: str | None,
        session: AsyncSession,
    ):

        result = await session.execute(
            select(Dispute).where(
                Dispute.dispute_id == dispute_id
            )
        )

        dispute = result.scalar_one_or_none()

        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dispute not found.",
            )

        if dispute.status == DisputeStatus.RESOLVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dispute is already resolved.",
            )

        shipment = await self._get_shipment(
            dispute.shipment_id,
            session,
        )

        # -----------------------------------------------------
        # Resolve payment through ShipmentService
        # -----------------------------------------------------

        from app.services.shipment_services import ShipmentService

        shipment_service = ShipmentService()

        if action == DisputeAction.REFUND:

            await shipment_service._complete_and_refund_dispute(
                shipment,
                session,
            )

        elif action == DisputeAction.RELEASE:

            await shipment_service._complete_and_release(
                shipment,
                session,
            )

        else:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid dispute resolution action.",
            )

        # -----------------------------------------------------
        # Resolve dispute
        # -----------------------------------------------------

        now = datetime.now(timezone.utc)

        dispute.status = DisputeStatus.RESOLVED
        dispute.resolution_action = action
        dispute.resolution_note = note
        dispute.resolved_by = admin_user.uid
        dispute.resolved_at = now
        dispute.updated_at = now

        shipment.dispute_resolution = action.value
        shipment.dispute_resolved_at = now
        shipment.updated_at = now

        session.add(dispute)
        session.add(shipment)

        await session.commit()

        await session.refresh(dispute)

        return await self._build_response(
            dispute,
            session,
        )