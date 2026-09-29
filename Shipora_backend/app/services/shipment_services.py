import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.shipment_model import Shipment, ShipmentStatus, PaymentStatus
from app.models.application_model import Application, ApplicationStatus, InitiatedBy
from app.schema.shipment_schema import ShipmentCreate, CheckoutDetails, LocationUpdate
from app.services.profile_services import ProfileService
from app.services.wallet_services import WalletService
from app.services.notification_services import NotificationService
from app.models.notification_model import NotificationType
from app.utils.fees import (
    compute_shipment_charges,
    kobo,
    AUTO_RELEASE_HOURS,
    POST_ASSIGNMENT_CANCELLATION_FEE_RATE,
)
from app.utils import paystack


profile_service = ProfileService()
wallet_service = WalletService()
notification_service = NotificationService()


class ShipmentService:

    async def create_shipment(
        self,
        vendor_user_id: uuid.UUID,
        data: ShipmentCreate,
        session: AsyncSession,
    ) -> Shipment:

        vendor_profile = await profile_service.get_vendor_profile(
            vendor_user_id,
            session,
        )

        if not vendor_profile or not vendor_profile.nin_verified:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "A verified vendor profile is required.",
            )

        charges = compute_shipment_charges(
            kobo(data.delivery_amount)
        )

        shipment = Shipment(
            vendor_id=vendor_user_id,
            item_name=data.item_name,
            description=data.description,
            media=data.media,
            pickup=data.pickup,
            destination=data.destination,
            recipient_name=data.recipient_name,
            recipient_phone=data.recipient_phone,
            vehicle_preference=data.vehicle_preference,
            note=data.note,
            payment_by=data.payment_by,
            delivery_fee=charges["delivery_fee"],
            service_fee=charges["service_fee"],
            platform_commission=charges["platform_commission"],
            status=ShipmentStatus.PENDING_PAYMENT,
            payment_status=PaymentStatus.UNPAID,
        )

        session.add(shipment)
        await session.commit()
        await session.refresh(shipment)

        return shipment

    async def pay_from_wallet(
        self,
        shipment_id,
        payer_user_id,
        session,
    ):
        """
        Vendor-paid shipments settle instantly from the vendor's
        Shipora wallet balance.

        Paystack is only used when funding the Shipora wallet.
        """

        shipment = await self._get(
            shipment_id,
            session,
        )

        if shipment.vendor_id != payer_user_id:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Only the shipment vendor can make this payment.",
            )

        if shipment.status != ShipmentStatus.PENDING_PAYMENT:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This shipment is no longer awaiting payment.",
            )

        shipment = await wallet_service.pay_from_balance(
            shipment,
            session,
        )

        shipment.status = ShipmentStatus.OPEN
        shipment.updated_at = datetime.now(timezone.utc)

        session.add(shipment)
        await session.commit()
        await session.refresh(shipment)

        await notification_service.notify(
            user_id=shipment.vendor_id,
            type=NotificationType.PAYMENT,
            title="Payment secured",
            message=(
                f"₦{(shipment.delivery_fee + shipment.service_fee) / 100:,.2f} "
                f"was deducted from your Shipora balance and is held in escrow. "
                f"'{shipment.item_name}' is now live for dispatchers."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return shipment

    async def initiate_public_payment(
        self,
        public_token: str,
        payer_email: str,
        session,
        callback_url=None,
    ):
        shipment = await self._get_by_token(
            public_token,
            session,
        )

        if shipment.status != ShipmentStatus.PENDING_PAYMENT:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This shipment is no longer awaiting payment.",
            )

        if shipment.payment_by != "customer":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This shipment is configured for vendor payment.",
            )

        return await wallet_service.initiate_hold(
            shipment,
            payer_email,
            session,
            callback_url,
        )

    async def confirm_payment_and_open(
        self,
        shipment_id,
        session,
    ):
        shipment = await self._get(
            shipment_id,
            session,
        )

        if shipment.payment_status == PaymentStatus.HELD:
            return shipment

        confirmed = await wallet_service.confirm_hold(
            shipment,
            session,
        )

        if not confirmed:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Payment could not be verified.",
            )

        shipment.status = ShipmentStatus.OPEN
        shipment.updated_at = datetime.now(timezone.utc)

        session.add(shipment)
        await session.commit()
        await session.refresh(shipment)

        await notification_service.notify(
            user_id=shipment.vendor_id,
            type=NotificationType.PAYMENT,
            title="Payment secured",
            message=(
                f"Your payment for '{shipment.item_name}' is held in escrow "
                f"and the shipment is now live for dispatchers."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return shipment

    async def list_open_jobs(
        self,
        session,
    ):
        result = await session.execute(
            select(Shipment)
            .where(Shipment.status == ShipmentStatus.OPEN)
            .order_by(Shipment.created_at.desc())
        )

        return result.scalars().all()

    async def list_vendor_shipments(
        self,
        vendor_user_id,
        session,
    ):
        result = await session.execute(
            select(Shipment)
            .where(Shipment.vendor_id == vendor_user_id)
            .order_by(Shipment.created_at.desc())
        )

        return result.scalars().all()

    async def list_dispatcher_deliveries(
        self,
        dispatcher_user_id,
        session,
    ):
        result = await session.execute(
            select(Shipment)
            .where(Shipment.dispatcher_id == dispatcher_user_id)
            .order_by(Shipment.created_at.desc())
        )

        return result.scalars().all()

    async def get_shipment_for_viewer(
        self,
        shipment_id,
        viewer_user_id,
        session,
    ):
        shipment = await self._get(
            shipment_id,
            session,
        )

        if (
            shipment.vendor_id != viewer_user_id
            and shipment.dispatcher_id != viewer_user_id
        ):
            shipment.recipient_name = None
            shipment.recipient_phone = None
            shipment.recipient_address = None
            shipment.recipient_city = None
            shipment.recipient_region = None
            shipment.recipient_postal_code = None
            shipment.recipient_lat = None
            shipment.recipient_lng = None

        return shipment

    async def get_public_checkout(
        self,
        public_token,
        session,
    ):
        return await self._get_by_token(
            public_token,
            session,
        )

    async def save_checkout_details(
        self,
        public_token,
        data: CheckoutDetails,
        session,
    ):
        shipment = await self._get_by_token(
            public_token,
            session,
        )

        if shipment.status in (
            ShipmentStatus.COMPLETED,
            ShipmentStatus.CANCELLED,
        ):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This shipment can no longer be edited.",
            )

        shipment.recipient_name = data.recipient_name
        shipment.recipient_phone = data.recipient_phone
        shipment.recipient_address = data.recipient_address
        shipment.recipient_city = data.recipient_city
        shipment.recipient_region = data.recipient_region
        shipment.recipient_postal_code = data.recipient_postal_code
        shipment.recipient_lat = data.recipient_lat
        shipment.recipient_lng = data.recipient_lng
        shipment.updated_at = datetime.now(timezone.utc)

        session.add(shipment)
        await session.commit()
        await session.refresh(shipment)

        return shipment

    async def apply_to_shipment(
        self,
        shipment_id,
        dispatcher_user_id,
        session,
        proposed_fee=None,
    ):
        dispatcher_profile = await profile_service.get_dispatcher_profile(
            dispatcher_user_id,
            session,
        )

        if (
            not dispatcher_profile
            or not dispatcher_profile.nin_verified
            or not dispatcher_profile.vehicle_verified
        ):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Dispatcher NIN and vehicle verification must be approved.",
            )

        shipment = await self._get(
            shipment_id,
            session,
        )

        if shipment.status != ShipmentStatus.OPEN:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This shipment isn't open for applications.",
            )

        existing = await session.execute(
            select(Application).where(
                Application.shipment_id == shipment_id,
                Application.dispatcher_id == dispatcher_user_id,
            )
        )

        if existing.scalar_one_or_none():
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "You've already applied to this shipment.",
            )

        application = Application(
            shipment_id=shipment_id,
            dispatcher_id=dispatcher_user_id,
            proposed_fee=(
                kobo(proposed_fee)
                if proposed_fee is not None
                else shipment.delivery_fee
            ),
            initiated_by=InitiatedBy.DISPATCHER,
            status=ApplicationStatus.PENDING,
        )

        session.add(application)
        await session.commit()
        await session.refresh(application)

        await notification_service.notify(
            user_id=shipment.vendor_id,
            type=NotificationType.APPLICATION,
            title="New dispatch application",
            message=f"A dispatcher applied to carry '{shipment.item_name}'.",
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return application

    async def invite_dispatcher(
        self,
        shipment_id,
        vendor_user_id,
        dispatcher_user_id,
        proposed_fee,
        session,
    ):
        shipment = await self._get_owned_shipment(
            shipment_id,
            vendor_user_id,
            session,
        )

        if shipment.status != ShipmentStatus.OPEN:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Only an open paid shipment can receive an invitation.",
            )

        profile = await profile_service.get_dispatcher_profile(
            dispatcher_user_id,
            session,
        )

        if (
            not profile
            or not profile.nin_verified
            or not profile.vehicle_verified
        ):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Dispatcher is not fully verified.",
            )

        existing = await session.execute(
            select(Application).where(
                Application.shipment_id == shipment_id,
                Application.dispatcher_id == dispatcher_user_id,
            )
        )

        if existing.scalar_one_or_none():
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "An application already exists for this dispatcher.",
            )

        application = Application(
            shipment_id=shipment_id,
            dispatcher_id=dispatcher_user_id,
            proposed_fee=(
                kobo(proposed_fee)
                if proposed_fee is not None
                else shipment.delivery_fee
            ),
            initiated_by=InitiatedBy.VENDOR,
            status=ApplicationStatus.PENDING,
        )

        session.add(application)
        await session.commit()
        await session.refresh(application)

        await notification_service.notify(
            user_id=dispatcher_user_id,
            type=NotificationType.DISPATCH,
            title="Delivery invitation",
            message=f"A vendor invited you to carry '{shipment.item_name}'.",
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return application

    async def list_applications_for_shipment(
        self,
        shipment_id,
        vendor_user_id,
        session,
    ):
        await self._get_owned_shipment(
            shipment_id,
            vendor_user_id,
            session,
        )

        result = await session.execute(
            select(Application)
            .where(Application.shipment_id == shipment_id)
            .order_by(Application.created_at.desc())
        )

        return result.scalars().all()

    async def accept_application(
        self,
        application_id,
        vendor_user_id,
        session,
    ):
        result = await session.execute(
            select(Application).where(
                Application.application_id == application_id
            )
        )

        application = result.scalar_one_or_none()

        if not application:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "Application not found.",
            )

        shipment = await self._get_owned_shipment(
            application.shipment_id,
            vendor_user_id,
            session,
        )

        if shipment.status != ShipmentStatus.OPEN:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This shipment is no longer open.",
            )

        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This application is no longer pending.",
            )

        result = await session.execute(
            select(Application).where(
                Application.shipment_id == shipment.shipment_id,
                Application.status == ApplicationStatus.PENDING,
            )
        )

        rejected_dispatcher_ids = []

        for row in result.scalars().all():
            if row.application_id == application_id:
                row.status = ApplicationStatus.ACCEPTED
            else:
                row.status = ApplicationStatus.REJECTED
                rejected_dispatcher_ids.append(row.dispatcher_id)

            row.updated_at = datetime.now(timezone.utc)
            session.add(row)

        shipment.dispatcher_id = application.dispatcher_id
        shipment.status = ShipmentStatus.ASSIGNED
        shipment.updated_at = datetime.now(timezone.utc)

        session.add(shipment)

        await session.commit()
        await session.refresh(shipment)

        await notification_service.notify(
            user_id=application.dispatcher_id,
            type=NotificationType.APPLICATION,
            title="Application accepted",
            message=(
                f"You've been assigned to deliver '{shipment.item_name}'. "
                "Recipient details are now visible."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        for dispatcher_id in rejected_dispatcher_ids:
            await notification_service.notify(
                user_id=dispatcher_id,
                type=NotificationType.APPLICATION,
                title="Application not selected",
                message=(
                    f"The vendor chose another dispatcher for "
                    f"'{shipment.item_name}'."
                ),
                session=session,
                shipment_id=shipment.shipment_id,
            )

        return shipment

    async def mark_picked_up(
        self,
        shipment_id,
        dispatcher_user_id,
        session,
    ):
        shipment = await self._get_assigned_shipment(
            shipment_id,
            dispatcher_user_id,
            session,
        )

        if shipment.status != ShipmentStatus.ASSIGNED:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Shipment must be assigned before pickup.",
            )

        shipment.status = ShipmentStatus.PICKED_UP

        shipment = await self._save(
            shipment,
            session,
        )

        await notification_service.notify(
            user_id=shipment.vendor_id,
            type=NotificationType.SHIPMENT,
            title="Item picked up",
            message=f"Your dispatcher picked up '{shipment.item_name}'.",
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return shipment

    async def mark_in_transit(
        self,
        shipment_id,
        dispatcher_user_id,
        session,
    ):
        shipment = await self._get_assigned_shipment(
            shipment_id,
            dispatcher_user_id,
            session,
        )

        if shipment.status != ShipmentStatus.PICKED_UP:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Shipment must be picked up first.",
            )

        shipment.status = ShipmentStatus.IN_TRANSIT

        shipment = await self._save(
            shipment,
            session,
        )

        await notification_service.notify(
            user_id=shipment.vendor_id,
            type=NotificationType.SHIPMENT,
            title="Shipment in transit",
            message=(
                f"'{shipment.item_name}' is on its way to "
                f"{shipment.destination}."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return shipment

    async def mark_out_for_delivery(
        self,
        shipment_id,
        vendor_user_id,
        session,
    ):
        shipment = await self._get_owned_shipment(
            shipment_id,
            vendor_user_id,
            session,
        )

        if shipment.status not in (
            ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT,
        ):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Shipment must be picked up before it can be marked out for delivery.",
            )

        shipment.status = ShipmentStatus.OUT_FOR_DELIVERY

        shipment = await self._save(
            shipment,
            session,
        )

        await notification_service.notify(
            user_id=shipment.dispatcher_id,
            type=NotificationType.SHIPMENT,
            title="Shipment out for delivery",
            message=(
                f"'{shipment.item_name}' is now out for delivery."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return shipment

    async def mark_delivered(
        self,
        shipment_id,
        dispatcher_user_id,
        session,
    ):
        shipment = await self._get_assigned_shipment(
            shipment_id,
            dispatcher_user_id,
            session,
        )

        if shipment.status != ShipmentStatus.OUT_FOR_DELIVERY:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Shipment must be marked out for delivery before it can be delivered.",
            )

        now = datetime.now(timezone.utc)

        shipment.status = ShipmentStatus.DELIVERED
        shipment.delivered_at = now
        shipment.auto_release_at = (
            now + timedelta(hours=AUTO_RELEASE_HOURS)
        )

        shipment = await self._save(
            shipment,
            session,
        )

        await notification_service.notify(
            user_id=shipment.vendor_id,
            type=NotificationType.SHIPMENT,
            title="Marked as delivered",
            message=(
                f"'{shipment.item_name}' was marked delivered. "
                f"Confirm or dispute within {AUTO_RELEASE_HOURS} hours, "
                f"or payment auto-releases to the dispatcher."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return shipment

    async def update_location(
        self,
        shipment_id,
        dispatcher_user_id,
        data: LocationUpdate,
        session,
    ):
        shipment = await self._get_assigned_shipment(
            shipment_id,
            dispatcher_user_id,
            session,
        )

        if shipment.status not in (
            ShipmentStatus.ASSIGNED,
            ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT,
        ):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Location updates are not allowed for this shipment state.",
            )

        shipment.current_location = data.location
        shipment.current_lat = data.lat
        shipment.current_lng = data.lng
        shipment.location_updated_at = datetime.now(timezone.utc)

        return await self._save(
            shipment,
            session,
        )

    async def public_tracking(
        self,
        tracking_number,
        session,
    ):
        result = await session.execute(
            select(Shipment).where(
                Shipment.tracking_number == tracking_number
            )
        )

        shipment = result.scalar_one_or_none()

        if not shipment:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "Tracking number not found.",
            )

        return {
            "tracking_number": shipment.tracking_number,
            "status": shipment.status.value,
            "location": shipment.current_location,
            "lat": shipment.current_lat,
            "lng": shipment.current_lng,
            "updated_at": shipment.location_updated_at,
            "destination": shipment.destination,
        }

    async def confirm_delivery(
        self,
        shipment_id,
        vendor_user_id,
        session,
    ):
        shipment = await self._get_owned_shipment(
            shipment_id,
            vendor_user_id,
            session,
        )

        if shipment.status != ShipmentStatus.DELIVERED:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Shipment hasn't been marked delivered yet.",
            )

        return await self._complete_and_release(
            shipment,
            session,
        )

    async def dispute_delivery(
        self,
        shipment_id,
        vendor_user_id,
        reason,
        session,
    ):
        shipment = await self._get_owned_shipment(
            shipment_id,
            vendor_user_id,
            session,
        )

        if shipment.status != ShipmentStatus.DELIVERED:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Only a delivered shipment can be disputed.",
            )

        shipment.status = ShipmentStatus.DISPUTED
        shipment.dispute_reason = reason
        shipment.auto_release_at = None
        shipment.updated_at = datetime.now(timezone.utc)

        shipment = await self._save(
            shipment,
            session,
        )

        await notification_service.notify(
            user_id=shipment.dispatcher_id,
            type=NotificationType.DISPUTE,
            title="Delivery disputed",
            message=(
                f"The vendor disputed '{shipment.item_name}': {reason}. "
                "Payout is on hold pending admin review."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return shipment

    async def auto_release_sweep(
        self,
        session,
    ):
        now = datetime.now(timezone.utc)

        result = await session.execute(
            select(Shipment).where(
                Shipment.status == ShipmentStatus.DELIVERED,
                Shipment.auto_release_at <= now,
            )
        )

        due = result.scalars().all()
        count = 0

        for shipment in due:
            try:
                await self._complete_and_release(
                    shipment,
                    session,
                )
                count += 1
            except Exception:
                await session.rollback()

        return count

    async def _complete_and_release(
        self,
        shipment,
        session,
    ):
        """
        Escrow release credits the dispatcher's Shipora wallet.

        The dispatcher can later withdraw the available wallet balance
        to their saved bank account.
        """

        dispatcher_profile = await profile_service.get_dispatcher_profile(
            shipment.dispatcher_id,
            session,
        )

        if not dispatcher_profile:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Assigned dispatcher profile missing.",
            )

        shipment.status = ShipmentStatus.COMPLETED
        shipment.completed_at = datetime.now(timezone.utc)
        shipment.auto_release_at = None

        session.add(shipment)
        await session.commit()

        await wallet_service.release_to_dispatcher(
            shipment,
            session,
        )

        await session.refresh(shipment)

        payout_naira = (
            shipment.delivery_fee - shipment.platform_commission
        ) / 100

        await notification_service.notify(
            user_id=shipment.dispatcher_id,
            type=NotificationType.PAYMENT,
            title="Payment released",
            message=(
                f"₦{payout_naira:,.2f} for '{shipment.item_name}' "
                "has been added to your Shipora balance. "
                "Withdraw it any time from your wallet."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        await notification_service.notify(
            user_id=shipment.vendor_id,
            type=NotificationType.SHIPMENT,
            title="Delivery completed",
            message=(
                f"'{shipment.item_name}' is complete. "
                "Don't forget to rate your dispatcher."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return shipment

    async def cancel_shipment(
        self,
        shipment_id,
        vendor_user_id,
        session,
    ):
        shipment = await self._get_owned_shipment(
            shipment_id,
            vendor_user_id,
            session,
        )

        if shipment.status in (
            ShipmentStatus.PENDING_PAYMENT,
            ShipmentStatus.OPEN,
        ):
            if shipment.payment_status == PaymentStatus.HELD:
                await wallet_service.refund_to_vendor(
                    shipment,
                    session,
                    "Vendor cancellation before assignment",
                )

            shipment.status = ShipmentStatus.CANCELLED

            return await self._save(
                shipment,
                session,
            )

        if shipment.status == ShipmentStatus.ASSIGNED:
            cancellation_fee = int(
                round(
                    shipment.delivery_fee
                    * POST_ASSIGNMENT_CANCELLATION_FEE_RATE
                )
            )

            await wallet_service.cancel_after_assignment(
                shipment,
                session,
                cancellation_fee,
            )

            shipment.status = ShipmentStatus.CANCELLED

            shipment.note = (
                f"{shipment.note or ''}\n"
                f"Cancellation: {cancellation_fee / 100:.2f} NGN "
                "fee paid to assigned dispatcher."
            ).strip()

            shipment = await self._save(
                shipment,
                session,
            )

            await notification_service.notify(
                user_id=shipment.dispatcher_id,
                type=NotificationType.SHIPMENT,
                title="Shipment cancelled",
                message=(
                    f"The vendor cancelled '{shipment.item_name}' "
                    "after assignment. "
                    f"₦{cancellation_fee / 100:,.2f} has been added "
                    "to your Shipora balance as a cancellation fee."
                ),
                session=session,
                shipment_id=shipment.shipment_id,
            )

            return shipment

        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Cancellation is not available after pickup. Contact admin/support.",
        )

    async def _complete_and_refund_dispute(
        self,
        shipment,
        session,
    ):
        await wallet_service.refund_to_vendor(
            shipment,
            session,
            "Dispute resolved in vendor favour",
        )

        shipment.status = ShipmentStatus.CANCELLED
        shipment.dispute_resolution = "refund"
        shipment.dispute_resolved_at = datetime.now(timezone.utc)

        shipment = await self._save(
            shipment,
            session,
        )

        await notification_service.notify(
            user_id=shipment.vendor_id,
            type=NotificationType.DISPUTE,
            title="Dispute resolved: refunded",
            message=(
                f"Admin resolved the dispute for '{shipment.item_name}' "
                "in your favour. You've been refunded."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        await notification_service.notify(
            user_id=shipment.dispatcher_id,
            type=NotificationType.DISPUTE,
            title="Dispute resolved: refunded to vendor",
            message=(
                f"Admin resolved the dispute for '{shipment.item_name}' "
                "in the vendor's favour."
            ),
            session=session,
            shipment_id=shipment.shipment_id,
        )

        return shipment

    async def _get(
        self,
        shipment_id,
        session,
    ):
        result = await session.execute(
            select(Shipment).where(
                Shipment.shipment_id == shipment_id
            )
        )

        shipment = result.scalar_one_or_none()

        if not shipment:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "Shipment not found.",
            )

        return shipment

    async def _get_by_token(
        self,
        token,
        session,
    ):
        result = await session.execute(
            select(Shipment).where(
                Shipment.public_token == token
            )
        )

        shipment = result.scalar_one_or_none()

        if not shipment:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "Shipment link not found.",
            )

        return shipment

    async def _get_owned_shipment(
        self,
        shipment_id,
        user_id,
        session,
    ):
        shipment = await self._get(
            shipment_id,
            session,
        )

        if shipment.vendor_id != user_id:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "This isn't your shipment.",
            )

        return shipment

    async def _get_assigned_shipment(
        self,
        shipment_id,
        user_id,
        session,
    ):
        shipment = await self._get(
            shipment_id,
            session,
        )

        if shipment.dispatcher_id != user_id:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "You aren't the assigned dispatcher.",
            )

        return shipment

    async def _save(
        self,
        shipment,
        session,
    ):
        shipment.updated_at = datetime.now(timezone.utc)

        session.add(shipment)

        await session.commit()
        await session.refresh(shipment)

        return shipment