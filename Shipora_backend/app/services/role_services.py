from app.schema.role_schema import VendorCreate, DispatcherCreate, BothRolesCreate
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.vendor_model import Vendor, VerificationStatus as VendorVerificationStatus
from app.models.dispatcher_model import Dispatcher, VerificationStatus as DispatcherVerificationStatus
from app.models.both_roles_model import BothRoles, VerificationStatus as BothRolesVerificationStatus
from sqlalchemy import select
from fastapi.exceptions import HTTPException
from fastapi import status


class RoleService:

    # ============================================================
    # DUPLICATE HELPERS
    # ============================================================

    async def vendor_withemail_exists(self, email: str, vendor: bool, session: AsyncSession):
        model = Vendor if vendor else Dispatcher
        result = await session.execute(select(model).where(model.email == email))
        return result.scalar_one_or_none()

    async def vendor_withphone_exists(self, phone: str, vendor: bool, session: AsyncSession):
        model = Vendor if vendor else Dispatcher
        result = await session.execute(select(model).where(model.phone == phone))
        return result.scalar_one_or_none()

    async def vendor_withnin_exists(self, nin: str, vendor: bool, session: AsyncSession):
        model = Vendor if vendor else Dispatcher
        result = await session.execute(select(model).where(model.nin == nin))
        return result.scalar_one_or_none()

    async def vendor_withcac_exists(self, cac: str, vendor: bool, session: AsyncSession):
        model = Vendor if vendor else Dispatcher
        result = await session.execute(select(model).where(model.cac_number == cac))
        return result.scalar_one_or_none()

    async def both_withemail_exists(self, email: str, session: AsyncSession):
        result = await session.execute(select(BothRoles).where(BothRoles.email == email))
        return result.scalar_one_or_none()

    async def both_withphone_exists(self, phone: str, session: AsyncSession):
        result = await session.execute(select(BothRoles).where(BothRoles.phone == phone))
        return result.scalar_one_or_none()

    async def both_withnin_exists(self, nin: str, session: AsyncSession):
        result = await session.execute(select(BothRoles).where(BothRoles.nin == nin))
        return result.scalar_one_or_none()

    async def both_withcac_exists(self, cac: str, session: AsyncSession):
        if not cac:
            return None

        result = await session.execute(
            select(BothRoles).where(BothRoles.cac_number == cac)
        )
        return result.scalar_one_or_none()

    # ============================================================
    # PROVIDER VERIFICATION
    # ============================================================

    async def _provider_verify(
        self,
        endpoint: str,
        payload: dict,
    ) -> tuple[str, str | None]:

        from app.utils.config import settings
        import httpx

        if not endpoint:
            # No real provider connected yet.
            # Never pretend the person is verified.
            return "pending", None

        headers = {}

        if settings.KYC_PROVIDER_API_KEY:
            headers["Authorization"] = (
                f"Bearer {settings.KYC_PROVIDER_API_KEY}"
            )

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                )

            response.raise_for_status()
            body = response.json()

        except Exception:
            return "review_required", None

        raw_status = str(
            body.get("status")
            or body.get("verification_status")
            or body.get("data", {}).get("status")
            or ""
        ).lower()

        verified = bool(
            body.get("verified")
            or body.get("data", {}).get("verified")
        )

        reference = (
            body.get("reference")
            or body.get("id")
            or body.get("data", {}).get("reference")
            or body.get("data", {}).get("id")
        )

        if verified or raw_status in {"verified", "success", "approved"}:
            return "verified", reference

        if raw_status in {
            "rejected",
            "failed",
            "invalid",
            "declined",
        }:
            return "rejected", reference

        if raw_status in {
            "review_required",
            "review",
            "manual_review",
            "pending_review",
        }:
            return "review_required", reference

        return "pending", reference

    async def verify_nin(
        self,
        nin: str,
        first_name: str,
        surname: str,
    ):
        from app.utils.config import settings

        if not nin:
            return "rejected", None

        endpoint = ""

        if settings.KYC_PROVIDER_BASE_URL:
            endpoint = (
                f"{settings.KYC_PROVIDER_BASE_URL.rstrip('/')}/nin"
            )

        return await self._provider_verify(
            endpoint,
            {
                "nin": nin,
                "first_name": first_name,
                "surname": surname,
            },
        )

    async def verify_cac(
        self,
        cac_number: str,
        business_name: str,
    ):
        from app.utils.config import settings

        if not cac_number:
            return "pending", None

        endpoint = ""

        if settings.KYC_PROVIDER_BASE_URL:
            endpoint = (
                f"{settings.KYC_PROVIDER_BASE_URL.rstrip('/')}/cac"
            )

        return await self._provider_verify(
            endpoint,
            {
                "cac_number": cac_number,
                "business_name": business_name,
            },
        )

    async def verify_drivers_licence(
        self,
        licence_number: str,
        first_name: str,
        surname: str,
    ):
        from app.utils.config import settings

        if not licence_number:
            return "rejected", None

        endpoint = ""

        if settings.KYC_PROVIDER_BASE_URL:
            endpoint = (
                f"{settings.KYC_PROVIDER_BASE_URL.rstrip('/')}/drivers-license"
            )

        return await self._provider_verify(
            endpoint,
            {
                "licence_number": licence_number,
                "first_name": first_name,
                "surname": surname,
            },
        )

    # ============================================================
    # VENDOR
    # ============================================================

    async def create_vendor(
        self,
        data: VendorCreate,
        user_id,
        session: AsyncSession,
    ):

        existing = await session.execute(
            select(Vendor).where(Vendor.user_id == user_id)
        )

        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This account has already been verified as a vendor.",
            )

        if await self.vendor_withemail_exists(data.email, True, session):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A vendor with this email already exists.",
            )

        if await self.vendor_withphone_exists(data.phone, True, session):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A vendor with this phone number already exists.",
            )

        if await self.vendor_withnin_exists(data.nin, True, session):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This NIN is already registered.",
            )

        # ---------------- NIN ----------------

        nin_result, nin_ref = await self.verify_nin(
            data.nin,
            data.first_name,
            data.surname,
        )

        nin_status = VendorVerificationStatus(nin_result)

        # ---------------- CAC ----------------

        cac_status = VendorVerificationStatus.PENDING
        cac_ref = None

        if data.cac_number:

            if await self.vendor_withcac_exists(
                data.cac_number,
                True,
                session,
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This CAC number is already registered.",
                )

            cac_result, cac_ref = await self.verify_cac(
                data.cac_number,
                data.business_name,
            )

            cac_status = VendorVerificationStatus(cac_result)

        vendor_data = data.model_dump()

        vendor = Vendor(
            **vendor_data,
            user_id=user_id,
            nin_verification_status=nin_status,
            nin_verification_ref=nin_ref,
            cac_verification_status=cac_status,
            cac_verification_ref=cac_ref,
        )

        session.add(vendor)

        await session.commit()
        await session.refresh(vendor)

        return vendor

    # ============================================================
    # DISPATCHER
    # ============================================================

    async def create_dispatcher(
        self,
        data: DispatcherCreate,
        user_id,
        session: AsyncSession,
    ):

        existing = await session.execute(
            select(Dispatcher).where(
                Dispatcher.user_id == user_id
            )
        )

        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This account has already been verified as a dispatcher.",
            )

        if await self.vendor_withemail_exists(data.email, False, session):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A dispatcher with this email already exists.",
            )

        if await self.vendor_withphone_exists(data.phone, False, session):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A dispatcher with this phone number already exists.",
            )

        if await self.vendor_withnin_exists(data.nin, False, session):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This NIN is already registered.",
            )

        # ---------------- NIN ----------------

        nin_result, nin_ref = await self.verify_nin(
            data.nin,
            data.first_name,
            data.surname,
        )

        nin_status = DispatcherVerificationStatus(nin_result)

        # ---------------- VEHICLE ----------------

        result = await session.execute(
            select(Dispatcher).where(
                Dispatcher.vehicle_registration
                == data.vehicle_registration
            )
        )

        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This vehicle registration is already registered.",
            )

        # Vehicle verification will be connected to the real provider/
        # review system later. It remains pending until verified.
        vehicle_status = DispatcherVerificationStatus.PENDING

        # ---------------- DRIVER LICENCE ----------------

        licence_status = None

        if data.is_driver:

            if not data.licence_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Driver's licence number is required when registering as a driver.",
                )

            result = await session.execute(
                select(Dispatcher).where(
                    Dispatcher.licence_number
                    == data.licence_number
                )
            )

            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This driver's licence is already registered.",
                )

            licence_result, _ = await self.verify_drivers_licence(
                data.licence_number,
                data.first_name,
                data.surname,
            )

            licence_status = licence_result

        dispatcher_data = data.model_dump()

        dispatcher = Dispatcher(
            **dispatcher_data,
            user_id=user_id,
            nin_verification_status=nin_status,
            nin_verification_ref=nin_ref,
            vehicle_verification_status=vehicle_status,
        )

        session.add(dispatcher)

        await session.commit()
        await session.refresh(dispatcher)

        return dispatcher

    # ============================================================
    # BOTH ROLES
    # ============================================================

    async def create_both_roles(
        self,
        data: BothRolesCreate,
        user_id,
        session: AsyncSession,
    ):

        existing = await session.execute(
            select(BothRoles).where(
                BothRoles.user_id == user_id
            )
        )

        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This account has already been verified.",
            )

        # ---------------- EMAIL ----------------

        if (
            await self.vendor_withemail_exists(data.email, True, session)
            or await self.vendor_withemail_exists(data.email, False, session)
            or await self.both_withemail_exists(data.email, session)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists",
            )

        # ---------------- PHONE ----------------

        if (
            await self.vendor_withphone_exists(data.phone, True, session)
            or await self.vendor_withphone_exists(data.phone, False, session)
            or await self.both_withphone_exists(data.phone, session)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phone number already exists",
            )

        # ---------------- NIN ----------------

        if (
            await self.vendor_withnin_exists(data.nin, True, session)
            or await self.vendor_withnin_exists(data.nin, False, session)
            or await self.both_withnin_exists(data.nin, session)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="NIN already exists",
            )

        # ---------------- NIN VERIFICATION ----------------

        nin_result, nin_ref = await self.verify_nin(
            data.nin,
            data.first_name,
            data.surname,
        )

        nin_status = BothRolesVerificationStatus(nin_result)

        # ---------------- OPTIONAL CAC ----------------

        cac_status = BothRolesVerificationStatus.PENDING
        cac_ref = None

        if data.cac_number:

            if (
                await self.vendor_withcac_exists(
                    data.cac_number,
                    True,
                    session,
                )
                or await self.vendor_withcac_exists(
                    data.cac_number,
                    False,
                    session,
                )
                or await self.both_withcac_exists(
                    data.cac_number,
                    session,
                )
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="CAC number already exists",
                )

            cac_result, cac_ref = await self.verify_cac(
                data.cac_number,
                data.business_name,
            )

            cac_status = BothRolesVerificationStatus(cac_result)

        # ---------------- VEHICLE ----------------

        result = await session.execute(
            select(Dispatcher).where(
                Dispatcher.vehicle_registration
                == data.vehicle_registration
            )
        )

        result_both = await session.execute(
            select(BothRoles).where(
                BothRoles.vehicle_registration
                == data.vehicle_registration
            )
        )

        if (
            result.scalar_one_or_none()
            or result_both.scalar_one_or_none()
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This vehicle registration is already registered.",
            )

        vehicle_status = BothRolesVerificationStatus.PENDING

        # ---------------- DRIVER LICENCE ----------------

        if data.is_driver:

            if not data.licence_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Driver's licence number is required when registering as a driver.",
                )

            result = await session.execute(
                select(Dispatcher).where(
                    Dispatcher.licence_number
                    == data.licence_number
                )
            )

            result_both = await session.execute(
                select(BothRoles).where(
                    BothRoles.licence_number
                    == data.licence_number
                )
            )

            if (
                result.scalar_one_or_none()
                or result_both.scalar_one_or_none()
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This driver's licence is already registered.",
                )

            licence_result, _ = await self.verify_drivers_licence(
                data.licence_number,
                data.first_name,
                data.surname,
            )

            if licence_result == "rejected":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Driver's licence verification failed.",
                )

        # ---------------- CREATE PROFILE ----------------

        both_data = data.model_dump()

        bothroles = BothRoles(
            **both_data,
            user_id=user_id,
            nin_verification_status=nin_status,
            nin_verification_ref=nin_ref,
            cac_verification_status=cac_status,
            cac_verification_ref=cac_ref,
            vehicle_verification_status=vehicle_status,
        )

        session.add(bothroles)

        await session.commit()
        await session.refresh(bothroles)

        return bothroles
