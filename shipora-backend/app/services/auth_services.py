from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user_model import User
from ..utils.hash_password import hash_password
from ..schema.user import AbstractUserDataModel, UserDataModel
import uuid


class AuthService:


    async def get_current_user(self, uid: uuid.UUID, session: AsyncSession):
        statement = select(User).where(User.uid == uid).options(selectinload(User.socials))
        user = (await session.execute(statement)).scalars().one_or_none()

        return UserDataModel.model_validate(user)

    async def get_user(self, email: str, session: AsyncSession):
        statement = select(User).where(User.email == email)
        user = (await session.execute(statement)).scalars().one_or_none()

        return user

    
    async def get_uid_user(self, uid: uuid.UUID, session: AsyncSession):
        statement = select(User).where(User.uid == uid)
        user = (await session.execute(statement)).scalars().one_or_none()

        return user


    async def create_user(self, user_data: dict, session: AsyncSession):
        existing_user = self.get_user(email=user_data['email'], session=session)

        if existing_user == None:
            return None

        try:
            user_data['password'] = hash_password(user_data['password'])
            new_user = User(**user_data)
            session.add(new_user)
            session.commit()
            session.refresh(new_user)

            return AbstractUserDataModel.model_validate(new_user)

        except Exception as e:
            await session.rollback()
            raise e