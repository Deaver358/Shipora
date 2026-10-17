from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from ..models.user_model import User
from ..utils.hash_password import hash_password
from ..schema.user import AbstractUserDataModel, UserDataModel
import uuid


def normalize_email(email: str | None) -> str:
    return (email or "").strip().lower()


class AuthService:

    async def get_current_user(self, uid: uuid.UUID, session: AsyncSession):
        statement = select(User).where(User.uid == uid)
        user = (await session.execute(statement)).scalars().one_or_none()

        if user is None:
            return None

        return UserDataModel.model_validate(user)

    async def get_user(self, email: str, session: AsyncSession):
        # Case-insensitive so "John@Mail.com" and "john@mail.com" are the
        # same account (mobile keyboards capitalise the first letter).
        statement = select(User).where(
            func.lower(User.email) == normalize_email(email)
        )
        user = (await session.execute(statement)).scalars().first()

        return user

    async def get_user_by_phone(self, phone: str, session: AsyncSession):
        if not phone:
            return None
        statement = select(User).where(User.phone == phone.strip())
        return (await session.execute(statement)).scalars().first()

    async def get_uid_user(self, uid: uuid.UUID, session: AsyncSession):
        statement = select(User).where(User.uid == uid)
        user = (await session.execute(statement)).scalars().one_or_none()

        return user

    async def create_user(self, user_data: dict, session: AsyncSession):
        existing_user = await self.get_user(
            email=user_data["email"],
            session=session,
        )

        if existing_user is not None:
            return None

        try:
            user_data["email"] = normalize_email(user_data["email"])

            if user_data.get("phone"):
                user_data["phone"] = str(user_data["phone"]).strip()
            else:
                user_data["phone"] = None

            if user_data.get("password"):
                user_data["password"] = hash_password(
                    user_data["password"]
                )

            new_user = User(**user_data)

            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)

            return AbstractUserDataModel.model_validate(new_user)

        except IntegrityError:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email or phone number already exists.",
            )

        except Exception as e:
            await session.rollback()
            raise e

    async def update_user_info(
        self,
        user: User,
        info: dict,
        session: AsyncSession,
    ):
        try:
            for k, v in info.items():
                setattr(user, k, v)

            await session.commit()
            await session.refresh(user)

            return {"message": "Updated successfully"}

        except Exception as e:
            await session.rollback()
            raise e
