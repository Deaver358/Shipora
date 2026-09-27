import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_config import session
from app.core.dependencies import get_this_user
from app.models.user_model import User
from app.models.dispatch_availability_model import DispatchAvailability
from app.schema.availability_schema import AvailabilityCreate, AvailabilityResponse
from app.services.profile_services import ProfileService

router = APIRouter()
profiles = ProfileService()


@router.post("", response_model=AvailabilityResponse, status_code=status.HTTP_201_CREATED)
async def create_availability(data: AvailabilityCreate, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    profile = await profiles.get_dispatcher_profile(user.uid, session)
    if not profile or not profile.nin_verified or not profile.vehicle_verified:
        from fastapi import HTTPException
        raise HTTPException(403, "Dispatcher NIN and vehicle verification must be approved.")
    row = DispatchAvailability(dispatcher_id=user.uid, **data.model_dump())
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


@router.get("", response_model=list[AvailabilityResponse])
async def list_availability(
    state: str | None = None,
    city: str | None = None,
    vehicle_type: str | None = None,
    session: AsyncSession = Depends(session),
):
    q = select(DispatchAvailability).where(DispatchAvailability.is_active == True)
    if state:
        q = q.where(DispatchAvailability.operating_state.ilike(f"%{state}%"))
    if city:
        q = q.where(DispatchAvailability.operating_city.ilike(f"%{city}%"))
    if vehicle_type:
        q = q.where(DispatchAvailability.vehicle_type.ilike(f"%{vehicle_type}%"))
    result = await session.execute(q.order_by(DispatchAvailability.created_at.desc()))
    return result.scalars().all()


@router.patch("/{availability_id}/deactivate")
async def deactivate_availability(availability_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    from fastapi import HTTPException
    result = await session.execute(select(DispatchAvailability).where(DispatchAvailability.availability_id == availability_id, DispatchAvailability.dispatcher_id == user.uid))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(404, "Availability post not found.")
    row.is_active = False
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    await session.commit()
    return {"message": "Availability deactivated."}
