from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_config import session
from app.core.dependencies import get_this_user
from app.models.user_model import User
from app.schema.rating_schema import RatingCreate, RatingResponse
from app.services.rating_services import RatingService

router = APIRouter()
rating_service = RatingService()


@router.post("", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def rate_shipment(
    data: RatingCreate,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    rating = await rating_service.create_rating(user.uid, data, session)
    return RatingResponse.model_validate(rating)
