import uuid
from typing import Optional

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification_model import Notification, NotificationType


class NotificationService:
    async def notify(
        self,
        user_id: uuid.UUID,
        type: NotificationType,
        title: str,
        message: str,
        session: AsyncSession,
        shipment_id: Optional[uuid.UUID] = None,
        commit: bool = True,
    ) -> Notification:
        """
        Fire-and-forget-ish notification creation. Called from inside other
        services' transactions — pass commit=False if the caller is about to
        commit anyway as part of the same unit of work, to avoid extra round trips.
        """
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            shipment_id=shipment_id,
        )
        session.add(notification)
        if commit:
            await session.commit()
        return notification

    async def list_for_user(self, user_id: uuid.UUID, session: AsyncSession, unread_only: bool = False):
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.read == False)  # noqa: E712
        stmt = stmt.order_by(Notification.created_at.desc())
        result = await session.execute(stmt)
        return result.scalars().all()

    async def unread_count(self, user_id: uuid.UUID, session: AsyncSession) -> int:
        result = await session.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user_id, Notification.read == False  # noqa: E712
            )
        )
        return result.scalar_one()

    async def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID, session: AsyncSession):
        result = await session.execute(
            select(Notification).where(
                Notification.notification_id == notification_id, Notification.user_id == user_id
            )
        )
        notification = result.scalar_one_or_none()
        if not notification:
            return None
        notification.read = True
        session.add(notification)
        await session.commit()
        return notification

    async def mark_all_read(self, user_id: uuid.UUID, session: AsyncSession):
        await session.execute(
            update(Notification).where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
            .values(read=True)
        )
        await session.commit()

    async def delete(self, notification_id: uuid.UUID, user_id: uuid.UUID, session: AsyncSession):
        result = await session.execute(
            select(Notification).where(
                Notification.notification_id == notification_id, Notification.user_id == user_id
            )
        )
        notification = result.scalar_one_or_none()
        if not notification:
            return False
        await session.delete(notification)
        await session.commit()
        return True
