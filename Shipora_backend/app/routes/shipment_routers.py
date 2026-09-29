import json
import uuid
from fastapi import APIRouter, Depends, status, Request, Header, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_config import session
from app.core.dependencies import get_this_user
from app.models.user_model import User
from app.schema.shipment_schema import (
    ShipmentCreate, ShipmentJobResponse, ShipmentDetailResponse, DisputeRequest,
    CheckoutDetails, LocationUpdate, CancelRequest
)
from app.schema.application_schema import ApplicationResponse, ApplicationCreate
from app.services.shipment_services import ShipmentService
from app.utils import paystack
from app.utils.config import settings
from app.utils.mail import create_message, mail

router = APIRouter()
shipment_service = ShipmentService()


async def _send_shipment_email(email: str, shipment):
    link = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/shipment/{shipment.public_token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px">
      <h2>Shipora — Shipment Created</h2>
      <p>Your shipment has been created and is awaiting payment.</p>
      <p><strong>Tracking number:</strong> {shipment.tracking_number}</p>
      <p><strong>Package:</strong> {shipment.item_name}</p>
      <p><strong>Delivery fee:</strong> ₦{shipment.delivery_fee/100:,.2f}</p>
      <p><strong>Service fee:</strong> ₦{shipment.service_fee/100:,.2f}</p>
      <p><a href="{link}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px">View Shipment / Checkout</a></p>
    </div>
    """
    try:
        msg = await create_message([email], "Shipora — Shipment Created", html)
        await mail.send_message(msg)
    except Exception as exc:
        print(f"Shipment email failed: {exc}")


@router.post("", response_model=ShipmentDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_shipment(
    data: ShipmentCreate,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    return await shipment_service.create_shipment(
        user.uid,
        data,
        session,
    )


@router.post("/{shipment_id}/pay", response_model=ShipmentDetailResponse)
async def pay_for_shipment(
    shipment_id: uuid.UUID,
    bg: BackgroundTasks,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    shipment = await shipment_service.pay_from_wallet(
        shipment_id,
        user.uid,
        session,
    )

    bg.add_task(
        _send_shipment_email,
        user.email,
        shipment,
    )

    return shipment


@router.post("/paystack/webhook")
async def paystack_webhook(
    request: Request,
    session: AsyncSession = Depends(session),
    x_paystack_signature: str | None = Header(default=None),
):
    raw = await request.body()

    if not paystack.verify_webhook_signature(
        raw,
        x_paystack_signature,
    ):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid Paystack signature.",
        )

    payload = json.loads(raw.decode("utf-8"))
    event = payload.get("event")
    data = payload.get("data") or {}
    reference = data.get("reference", "")

    if event == "charge.success" and reference.startswith("SHP-TOPUP-"):
        from app.services.wallet_services import WalletService
        from app.services.notification_services import NotificationService
        from app.models.notification_model import NotificationType

        txn = await WalletService().confirm_topup(
            reference,
            session,
        )

        await NotificationService().notify(
            user_id=txn.user_id,
            type=NotificationType.PAYMENT,
            title="Wallet topped up",
            message=(
                f"₦{txn.amount / 100:,.2f} "
                "was added to your Shipora balance."
            ),
            session=session,
        )

    return {"received": True}

@router.get("/jobs", response_model=list[ShipmentJobResponse])
async def list_open_jobs(user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.list_open_jobs(session)


@router.get("/mine", response_model=list[ShipmentDetailResponse])
async def list_my_shipments(user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.list_vendor_shipments(user.uid, session)


@router.get("/deliveries", response_model=list[ShipmentDetailResponse])
async def list_my_deliveries(user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.list_dispatcher_deliveries(user.uid, session)


@router.get("/public/{public_token}", response_model=ShipmentDetailResponse)
async def public_checkout(public_token: str, session: AsyncSession = Depends(session)):
    return await shipment_service.get_public_checkout(public_token, session)


@router.post("/public/{public_token}/checkout", response_model=ShipmentDetailResponse)
async def save_checkout(public_token: str, data: CheckoutDetails, session: AsyncSession = Depends(session)):
    return await shipment_service.save_checkout_details(public_token, data, session)


@router.post("/public/{public_token}/pay")
async def public_pay(public_token: str, email: str, session: AsyncSession = Depends(session)):
    checkout_url = await shipment_service.initiate_public_payment(public_token, email, session, f"{settings.PUBLIC_BASE_URL}/shipment/{public_token}")
    return {"authorization_url": checkout_url}


@router.get("/tracking/{tracking_number}")
async def tracking(tracking_number: str, session: AsyncSession = Depends(session)):
    return await shipment_service.public_tracking(tracking_number, session)


@router.get("/{shipment_id}", response_model=ShipmentDetailResponse)
async def get_shipment(shipment_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.get_shipment_for_viewer(shipment_id, user.uid, session)


@router.post("/{shipment_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_shipment(shipment_id: uuid.UUID, data: ApplicationCreate | None = None, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    fee = data.proposed_fee if data else None
    return await shipment_service.apply_to_shipment(shipment_id, user.uid, session, fee)


@router.get("/{shipment_id}/applications", response_model=list[ApplicationResponse])
async def list_applications(shipment_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.list_applications_for_shipment(shipment_id, user.uid, session)


@router.post("/{shipment_id}/invite/{dispatcher_user_id}", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def invite_dispatcher(shipment_id: uuid.UUID, dispatcher_user_id: uuid.UUID, data: ApplicationCreate | None = None, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    fee = data.proposed_fee if data else None
    return await shipment_service.invite_dispatcher(shipment_id, user.uid, dispatcher_user_id, fee, session)


@router.post("/applications/{application_id}/accept", response_model=ShipmentDetailResponse)
async def accept_application(application_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.accept_application(application_id, user.uid, session)


@router.post("/{shipment_id}/pickup", response_model=ShipmentDetailResponse)
async def mark_picked_up(shipment_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.mark_picked_up(shipment_id, user.uid, session)


@router.post("/{shipment_id}/in-transit", response_model=ShipmentDetailResponse)
async def mark_in_transit(shipment_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.mark_in_transit(shipment_id, user.uid, session)


@router.post("/{shipment_id}/location", response_model=ShipmentDetailResponse)
async def update_location(shipment_id: uuid.UUID, data: LocationUpdate, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.update_location(shipment_id, user.uid, data, session)

@router.post("/{shipment_id}/out-for-delivery", response_model=ShipmentDetailResponse)
async def mark_out_for_delivery(
    shipment_id: uuid.UUID,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    return await shipment_service.mark_out_for_delivery(
        shipment_id,
        user.uid,
        session,
    )


@router.post("/{shipment_id}/delivered", response_model=ShipmentDetailResponse)
async def mark_delivered(shipment_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.mark_delivered(shipment_id, user.uid, session)


@router.post("/{shipment_id}/confirm", response_model=ShipmentDetailResponse)
async def confirm_delivery(shipment_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.confirm_delivery(shipment_id, user.uid, session)


@router.post("/{shipment_id}/dispute", response_model=ShipmentDetailResponse)
async def dispute_delivery(shipment_id: uuid.UUID, data: DisputeRequest, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.dispute_delivery(shipment_id, user.uid, data.reason, session)


@router.post("/{shipment_id}/cancel", response_model=ShipmentDetailResponse)
async def cancel_shipment(shipment_id: uuid.UUID, data: CancelRequest | None = None, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    return await shipment_service.cancel_shipment(shipment_id, user.uid, session)
