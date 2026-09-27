import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session_config import session
from app.core.dependencies import get_this_user
from app.models.user_model import User
from app.schema.notification_schema import NotificationResponse, UnreadCountResponse
from app.services.notification_services import NotificationService

router = APIRouter()
notification_service = NotificationService()


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    user: User = Depends(get_this_user),
    session: AsyncSession = Depends(session),
):
    return await notification_service.list_for_user(user.uid, session, unread_only=unread_only)


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count(user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    count = await notification_service.unread_count(user.uid, session)
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(notification_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    notification = await notification_service.mark_read(notification_id, user.uid, session)
    if not notification:
        raise HTTPException(404, "Notification not found.")
    return notification


@router.patch("/read-all")
async def mark_all_read(user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    await notification_service.mark_all_read(user.uid, session)
    return {"message": "All notifications marked as read."}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: uuid.UUID, user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    deleted = await notification_service.delete(notification_id, user.uid, session)
    if not deleted:
        raise HTTPException(404, "Notification not found.")
    return {"message": "Notification deleted."}
