import uuid

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_config import session
from app.core.dependencies import get_this_user
from app.models.user_model import User
from app.models.dispatch_availability_model import DispatchAvailability
from app.schema.availability_schema import (
    AvailabilityCreate,
    AvailabilityResponse,
)
from app.services.profile_services import ProfileService


router = APIRouter()
profiles = ProfileService()


async def build_availability_response(
    rows,
    db: AsyncSession,
):
    responses = []

    for row in rows:
        profile = await profiles.get_dispatcher_profile(
            row.dispatcher_id,
            db,
        )

        if not profile:
            continue

        responses.append(
            AvailabilityResponse(
                availability_id=row.availability_id,
                dispatcher_id=row.dispatcher_id,

                dispatcher_name=profile.full_name,
                dispatcher_rating=float(
                    profile.average_rating or 0
                ),
                dispatcher_total_ratings=int(
                    profile.total_ratings or 0
                ),
                dispatcher_verified=bool(
                    profile.nin_verified
                    and profile.vehicle_verified
                ),

                operating_state=row.operating_state,
                operating_city=row.operating_city,
                service_area=row.service_area,
                vehicle_type=row.vehicle_type,
                available_from=row.available_from,
                available_until=row.available_until,
                is_active=row.is_active,
                note=row.note,
                created_at=row.created_at,
            )
        )

    return responses


@router.post(
    "",
    response_model=AvailabilityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_availability(
    data: AvailabilityCreate,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    profile = await profiles.get_dispatcher_profile(
        user.uid,
        session,
    )

    if not profile or not profile.nin_verified or not profile.vehicle_verified:
        raise HTTPException(
            status_code=403,
            detail="Dispatcher NIN and vehicle verification must be approved.",
        )

    row = DispatchAvailability(
        dispatcher_id=user.uid,
        **data.model_dump(),
    )

    session.add(row)

    await session.commit()
    await session.refresh(row)

    response = await build_availability_response(
        [row],
        session,
    )

    return response[0]


@router.get(
    "/mine",
    response_model=list[AvailabilityResponse],
)
async def list_my_availability(
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    result = await session.execute(
        select(DispatchAvailability)
        .where(
            DispatchAvailability.dispatcher_id == user.uid,
            DispatchAvailability.is_active == True,
        )
        .order_by(
            DispatchAvailability.created_at.desc()
        )
    )

    rows = result.scalars().all()

    return await build_availability_response(
        rows,
        session,
    )


@router.get(
    "",
    response_model=list[AvailabilityResponse],
)
async def list_availability(
    state: str | None = None,
    city: str | None = None,
    vehicle_type: str | None = None,
    session: AsyncSession = Depends(session),
):
    q = select(DispatchAvailability).where(
        DispatchAvailability.is_active == True
    )

    if state:
        q = q.where(
            DispatchAvailability.operating_state.ilike(
                f"%{state}%"
            )
        )

    if city:
        q = q.where(
            DispatchAvailability.operating_city.ilike(
                f"%{city}%"
            )
        )

    if vehicle_type:
        q = q.where(
            DispatchAvailability.vehicle_type.ilike(
                f"%{vehicle_type}%"
            )
        )

    result = await session.execute(
        q.order_by(
            DispatchAvailability.created_at.desc()
        )
    )

    rows = result.scalars().all()

    return await build_availability_response(
        rows,
        session,
    )


@router.patch(
    "/{availability_id}/deactivate"
)
async def deactivate_availability(
    availability_id: uuid.UUID,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    result = await session.execute(
        select(DispatchAvailability).where(
            DispatchAvailability.availability_id == availability_id,
            DispatchAvailability.dispatcher_id == user.uid,
        )
    )

    row = result.scalar_one_or_none()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Availability post not found.",
        )

    row.is_active = False
    row.updated_at = datetime.now(timezone.utc)

    session.add(row)

    await session.commit()

    return {
        "message": "Availability deactivated."
    }