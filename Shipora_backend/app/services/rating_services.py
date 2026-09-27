import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shipment_model import Shipment, ShipmentStatus
from app.models.rating_model import Rating, RaterRole
from app.schema.rating_schema import RatingCreate
from app.services.profile_services import ProfileService

profile_service = ProfileService()


class RatingService:

    async def create_rating(self, rater_user_id: uuid.UUID, data: RatingCreate, session: AsyncSession) -> Rating:
        result = await session.execute(select(Shipment).where(Shipment.shipment_id == data.shipment_id))
        shipment = result.scalar_one_or_none()
        if not shipment:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Shipment not found.")
        if shipment.status != ShipmentStatus.COMPLETED:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "You can only rate after a shipment is completed.")

        if rater_user_id == shipment.vendor_id:
            rater_role = RaterRole.VENDOR
            rated_user_id = shipment.dispatcher_id
        elif rater_user_id == shipment.dispatcher_id:
            rater_role = RaterRole.DISPATCHER
            rated_user_id = shipment.vendor_id
        else:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You weren't part of this shipment.")

        existing = await session.execute(
            select(Rating).where(Rating.shipment_id == data.shipment_id, Rating.rater_id == rater_user_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status.HTTP_409_CONFLICT, "You've already rated this shipment.")

        rating = Rating(
            shipment_id=data.shipment_id,
            rater_id=rater_user_id,
            rater_role=rater_role,
            rated_user_id=rated_user_id,
            score=data.score,
            comment=data.comment,
        )
        session.add(rating)

        await self._update_cached_average(rated_user_id, rater_role, data.score, session)

        await session.commit()
        await session.refresh(rating)
        return rating

    async def _update_cached_average(self, rated_user_id: uuid.UUID, rater_role: RaterRole, score: int, session: AsyncSession):
        """
        rater_role tells us which side got rated: a VENDOR rater rates a
        dispatcher, so we bump the dispatcher's average; vice versa.
        """
        if rater_role == RaterRole.VENDOR:
            profile = await profile_service.get_dispatcher_profile(rated_user_id, session)
            if not profile:
                return
            row = profile.row
            if profile.source == "dispatcher":
                new_total = row.total_ratings + 1
                row.average_rating = ((row.average_rating * row.total_ratings) + score) / new_total
                row.total_ratings = new_total
            else:  # both_roles
                new_total = row.dispatcher_total_ratings + 1
                row.dispatcher_average_rating = ((row.dispatcher_average_rating * row.dispatcher_total_ratings) + score) / new_total
                row.dispatcher_total_ratings = new_total
        else:
            profile = await profile_service.get_vendor_profile(rated_user_id, session)
            if not profile:
                return
            row = profile.row
            if profile.source == "vendor":
                new_total = row.total_ratings + 1
                row.average_rating = ((row.average_rating * row.total_ratings) + score) / new_total
                row.total_ratings = new_total
            else:  # both_roles
                new_total = row.vendor_total_ratings + 1
                row.vendor_average_rating = ((row.vendor_average_rating * row.vendor_total_ratings) + score) / new_total
                row.vendor_total_ratings = new_total

        session.add(row)
