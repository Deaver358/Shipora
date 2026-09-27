import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.vendor_model import Vendor, VerificationStatus as VendorVerificationStatus
from app.models.dispatcher_model import Dispatcher, VerificationStatus as DispatcherVerificationStatus
from app.models.both_roles_model import BothRoles, VerificationStatus as BothRolesVerificationStatus


class VendorProfile:
    def __init__(self, source: str, row):
        self.source = source  # "vendor" | "both_roles"
        self.row = row
        self.full_name = f"{row.first_name} {row.surname}"
        self.nin_verified = row.nin_verification_status == (
            VendorVerificationStatus.VERIFIED if source == "vendor" else BothRolesVerificationStatus.VERIFIED
        )
        self.cac_verified = row.cac_verification_status == (
            VendorVerificationStatus.VERIFIED if source == "vendor" else BothRolesVerificationStatus.VERIFIED
        )
        self.average_rating = row.average_rating if source == "vendor" else row.vendor_average_rating
        self.total_ratings = row.total_ratings if source == "vendor" else row.vendor_total_ratings
        self.business_name = row.business_name
        self.vendor_type = row.vendor_type
        # payout destination — same fields whichever table backs this profile
        self.bank_code = row.bank_code
        self.account_number = row.account_number
        self.account_name = row.account_name
        self.paystack_recipient_code = row.paystack_recipient_code


class DispatcherProfile:
    def __init__(self, source: str, row):
        self.source = source  # "dispatcher" | "both_roles"
        self.row = row
        self.full_name = f"{row.first_name} {row.surname}"
        self.nin_verified = row.nin_verification_status == (
            DispatcherVerificationStatus.VERIFIED if source == "dispatcher" else BothRolesVerificationStatus.VERIFIED
        )
        self.vehicle_verified = row.vehicle_verification_status == (
            DispatcherVerificationStatus.VERIFIED if source == "dispatcher" else BothRolesVerificationStatus.VERIFIED
        )
        self.vehicle_type = row.vehicle_type
        self.average_rating = row.average_rating if source == "dispatcher" else row.dispatcher_average_rating
        self.total_ratings = row.total_ratings if source == "dispatcher" else row.dispatcher_total_ratings
        self.bank_code = row.bank_code
        self.account_number = row.account_number
        self.account_name = row.account_name
        self.paystack_recipient_code = row.paystack_recipient_code


class ProfileService:

    async def get_vendor_profile(self, user_id: uuid.UUID, session: AsyncSession) -> Optional[VendorProfile]:
        result = await session.execute(select(Vendor).where(Vendor.user_id == user_id))
        vendor = result.scalar_one_or_none()
        if vendor:
            return VendorProfile("vendor", vendor)

        result = await session.execute(select(BothRoles).where(BothRoles.user_id == user_id))
        both = result.scalar_one_or_none()
        if both:
            return VendorProfile("both_roles", both)

        return None

    async def get_dispatcher_profile(self, user_id: uuid.UUID, session: AsyncSession) -> Optional[DispatcherProfile]:
        result = await session.execute(select(Dispatcher).where(Dispatcher.user_id == user_id))
        dispatcher = result.scalar_one_or_none()
        if dispatcher:
            return DispatcherProfile("dispatcher", dispatcher)

        result = await session.execute(select(BothRoles).where(BothRoles.user_id == user_id))
        both = result.scalar_one_or_none()
        if both:
            return DispatcherProfile("both_roles", both)

        return None

    async def get_dispatcher_profile_by_user_id(self, user_id: uuid.UUID, session: AsyncSession):
        """Alias kept for readability at call sites that already have a dispatcher's user_id in hand."""
        return await self.get_dispatcher_profile(user_id, session)

    async def get_bank_profile(self, user_id: uuid.UUID, session: AsyncSession):
        """
        Role-agnostic lookup used by wallet withdrawals: a vendor, a
        dispatcher, and a both_roles account all withdraw the same way, so
        this just returns whichever profile exists for this user_id
        (VendorProfile and DispatcherProfile both expose the same
        bank_code/account_number/account_name/paystack_recipient_code shape).
        """
        profile = await self.get_vendor_profile(user_id, session)
        if profile:
            return profile
        return await self.get_dispatcher_profile(user_id, session)

    # =========================
    # Full profile (backs GET /profile/me)
    # =========================

    async def get_full_profile(self, user, session: AsyncSession) -> dict:
        """`user` is the UserDataModel returned by get_this_user."""
        vendor = await self.get_vendor_profile(user.uid, session)
        dispatcher = await self.get_dispatcher_profile(user.uid, session)

        vendor_out = None
        if vendor:
            vendor_out = {
                "business_name": vendor.business_name,
                "vendor_type": vendor.vendor_type,
                "nin_verified": vendor.nin_verified,
                "cac_verified": vendor.cac_verified,
                "average_rating": vendor.average_rating,
                "total_ratings": vendor.total_ratings,
                "has_payout_account": bool(vendor.bank_code and vendor.account_number),
                "account_name": vendor.account_name,
            }

        dispatcher_out = None
        if dispatcher:
            masked = None
            if dispatcher.account_number:
                masked = f"{'*' * (len(dispatcher.account_number) - 4)}{dispatcher.account_number[-4:]}"
            dispatcher_out = {
                "dispatch_name": dispatcher.row.dispatch_name,
                "vehicle_type": dispatcher.vehicle_type,
                "nin_verified": dispatcher.nin_verified,
                "vehicle_verified": dispatcher.vehicle_verified,
                "average_rating": dispatcher.average_rating,
                "total_ratings": dispatcher.total_ratings,
                "has_payout_account": bool(dispatcher.bank_code and dispatcher.account_number),
                "bank_code": dispatcher.bank_code,
                "bank_name": None,
                "account_number_masked": masked,
                "account_name": dispatcher.account_name,
            }

        return {
            "uid": user.uid,
            "fullname": user.fullname,
            "email": user.email,
            "phone": user.phone,
            "avatar_url": user.avatar_url,
            "role": user.role.value if hasattr(user.role, "value") else user.role,
            "vendor": vendor_out,
            "dispatcher": dispatcher_out,
        }

    # =========================
    # Update basic account info (name, phone, avatar)
    # =========================

    async def update_basic_info(self, user_id: uuid.UUID, fullname: Optional[str], phone: Optional[str], session: AsyncSession):
        from app.models.user_model import User

        result = await session.execute(select(User).where(User.uid == user_id))
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
        if fullname:
            row.fullname = fullname
        if phone:
            row.phone = phone
        row.updated_at = datetime.now(timezone.utc)
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return row

    async def set_avatar(self, user_id: uuid.UUID, avatar_url: str, session: AsyncSession):
        from app.models.user_model import User

        result = await session.execute(select(User).where(User.uid == user_id))
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
        row.avatar_url = avatar_url
        row.updated_at = datetime.now(timezone.utc)
        session.add(row)
        await session.commit()
        return row

    # =========================
    # Bank account (payout destination) — vendor, dispatcher, or both_roles
    # =========================

    async def update_bank_account(self, user_id: uuid.UUID, bank_code: str, account_number: str, session: AsyncSession):
        from app.utils import paystack

        result = await session.execute(select(Vendor).where(Vendor.user_id == user_id))
        row = result.scalar_one_or_none()
        if not row:
            result = await session.execute(select(Dispatcher).where(Dispatcher.user_id == user_id))
            row = result.scalar_one_or_none()
        if not row:
            both_result = await session.execute(select(BothRoles).where(BothRoles.user_id == user_id))
            row = both_result.scalar_one_or_none()
        if not row:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No verified profile found for this account.")

        try:
            resolved = await paystack.resolve_account_number(account_number, bank_code)
        except RuntimeError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

        row.bank_code = bank_code
        row.account_number = account_number
        row.account_name = resolved.get("account_name")
        # a changed account needs a fresh Paystack recipient before the next payout/withdrawal
        row.paystack_recipient_code = None
        row.updated_at = datetime.now(timezone.utc)
        session.add(row)
        await session.commit()
        return {"bank_code": row.bank_code, "account_number": row.account_number, "account_name": row.account_name}

    # =========================
    # Change password
    # =========================

    async def change_password(self, user_id: uuid.UUID, current_password: str, new_password: str, session: AsyncSession):
        from app.models.user_model import User
        from app.utils.hash_password import hash_password, verify_hash

        result = await session.execute(select(User).where(User.uid == user_id))
        row = result.scalar_one_or_none()
        if not row or not row.password:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
        if not verify_hash(current_password, row.password):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect.")
        row.password = hash_password(new_password)
        row.updated_at = datetime.now(timezone.utc)
        session.add(row)
        await session.commit()
        return True
