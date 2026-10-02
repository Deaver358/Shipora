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

    @staticmethod
    def _normalize_name(value: str | None) -> str:
        """
        Normalize names before comparison.

        Example:
        "David Emmanuel" -> "DAVID EMMANUEL"
        " David   Emmanuel " -> "DAVID EMMANUEL"
        """
        if not value:
            return ""

        return " ".join(
            str(value).strip().upper().split()
        )

    @classmethod
    def _names_match(
        cls,
        submitted_first_name: str | None,
        submitted_surname: str | None,
        provider_first_name: str | None,
        provider_surname: str | None,
        provider_full_name: str | None = None,
    ) -> bool:
        """
        Compare the name submitted by the user against the
        identity returned by the KYC provider.
        """

        submitted_first = cls._normalize_name(
            submitted_first_name
        )

        submitted_last = cls._normalize_name(
            submitted_surname
        )

        provider_first = cls._normalize_name(
            provider_first_name
        )

        provider_last = cls._normalize_name(
            provider_surname
        )

        submitted_full = cls._normalize_name(
            f"{submitted_first_name or ''} {submitted_surname or ''}"
        )

        provider_full = cls._normalize_name(
            provider_full_name
        )

        # Best case: provider gives first + surname separately.
        if provider_first and provider_last:
            return (
                provider_first == submitted_first
                and provider_last == submitted_last
            )

        # Otherwise compare provider's full name.
        if provider_full:
            return provider_full == submitted_full

        # No identity information was returned.
        # Do NOT automatically trust a simple "verified=true".
        return False

    @staticmethod
    def _extract_provider_data(body: dict) -> dict:
        """
        Safely extract provider data.

        Handles:
            data: {...}
            data: null
            no data field
        """

        data = body.get("data")

        if isinstance(data, dict):
            return data

        return {}

    async def _provider_verify(
        self,
        endpoint: str,
        payload: dict,
        submitted_first_name: str | None = None,
        submitted_surname: str | None = None,
    ) -> tuple[str, str | None]:

        from app.utils.config import settings
        import httpx

        if not endpoint:
            # No real provider connected.
            # Never pretend that the user is verified.
            return "review_required", None

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        if settings.KYC_PROVIDER_API_KEY:
            headers["Authorization"] = (
                f"Bearer {settings.KYC_PROVIDER_API_KEY}"
            )

        try:
            async with httpx.AsyncClient(
                timeout=30,
                follow_redirects=True,
            ) as client:

                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                )

                response.raise_for_status()

                body = response.json()

                if not isinstance(body, dict):
                    return "review_required", None

                # ------------------------------------------------
                # SAFE DATA EXTRACTION
                # ------------------------------------------------

                data = self._extract_provider_data(body)

                # ------------------------------------------------
                # STATUS
                # ------------------------------------------------

                raw_status_value = (
                    body.get("status")
                    if "status" in body
                    else body.get("verification_status")
                )

                # Some providers return:
                # "status": true
                if isinstance(raw_status_value, bool):

                    if raw_status_value is True:
                        provider_status = "success"
                    else:
                        provider_status = "failed"

                else:
                    provider_status = str(
                        raw_status_value
                        or data.get("status")
                        or data.get("verification_status")
                        or ""
                    ).strip().lower()

                # ------------------------------------------------
                # VERIFIED FLAGS
                # ------------------------------------------------

                verified_value = (
                    body.get("verified")
                    if "verified" in body
                    else data.get("verified")
                )

                verified = (
                    verified_value is True
                    or str(verified_value).strip().lower()
                    == "true"
                )

                # ------------------------------------------------
                # REFERENCE
                # ------------------------------------------------

                reference = (
                    body.get("reference")
                    or body.get("request_id")
                    or body.get("transaction_id")
                    or body.get("id")
                    or data.get("reference")
                    or data.get("request_id")
                    or data.get("transaction_id")
                    or data.get("id")
                )

                # ------------------------------------------------
                # PROVIDER IDENTITY
                # ------------------------------------------------

                provider_first_name = (
                    data.get("first_name")
                    or data.get("firstname")
                    or data.get("firstName")
                    or data.get("given_name")
                    or data.get("givenName")
                )

                provider_surname = (
                    data.get("surname")
                    or data.get("last_name")
                    or data.get("lastname")
                    or data.get("lastName")
                    or data.get("family_name")
                    or data.get("familyName")
                )

                provider_full_name = (
                    data.get("full_name")
                    or data.get("fullname")
                    or data.get("fullName")
                    or data.get("name")
                )

                # Some providers nest the identity information.
                identity = data.get("identity")

                if isinstance(identity, dict):

                    provider_first_name = (
                        provider_first_name
                        or identity.get("first_name")
                        or identity.get("firstname")
                        or identity.get("firstName")
                        or identity.get("given_name")
                    )

                    provider_surname = (
                        provider_surname
                        or identity.get("surname")
                        or identity.get("last_name")
                        or identity.get("lastname")
                        or identity.get("lastName")
                        or identity.get("family_name")
                    )

                    provider_full_name = (
                        provider_full_name
                        or identity.get("full_name")
                        or identity.get("fullname")
                        or identity.get("fullName")
                        or identity.get("name")
                    )

                # ------------------------------------------------
                # REJECTED STATES
                # ------------------------------------------------

                if provider_status in {
                    "rejected",
                    "failed",
                    "invalid",
                    "declined",
                    "not_found",
                    "not found",
                    "mismatch",
                    "unmatched",
                }:
                    return "rejected", reference

                # ------------------------------------------------
                # MANUAL REVIEW STATES
                # ------------------------------------------------

                if provider_status in {
                    "review_required",
                    "review",
                    "manual_review",
                    "pending_review",
                    "pending",
                    "processing",
                    "in_progress",
                }:
                    return "review_required", reference

                # ------------------------------------------------
                # SUCCESS / VERIFIED
                # ------------------------------------------------

                provider_success = (
                    verified
                    or provider_status in {
                        "verified",
                        "success",
                        "successful",
                        "approved",
                        "completed",
                    }
                )

                if provider_success:

                    # We require identity information before
                    # automatically accepting a personal KYC check.
                    identity_matches = self._names_match(
                        submitted_first_name,
                        submitted_surname,
                        provider_first_name,
                        provider_surname,
                        provider_full_name,
                    )

                    if identity_matches:
                        return "verified", reference

                    # Provider says verification succeeded but
                    # did not give enough matching identity data,
                    # or the names do not match.
                    return "review_required", reference

                # ------------------------------------------------
                # UNKNOWN RESPONSE
                # ------------------------------------------------

                return "review_required", reference

        except httpx.HTTPStatusError:
            return "review_required", None

        except (httpx.RequestError, ValueError, TypeError):
            return "review_required", None

        except Exception:
            return "review_required", None

    async def verify_nin(
        self,
        nin: str,
        first_name: str,
        surname: str,
    ):
        from app.services.qoreid_service import QoreIDService

        return await QoreIDService.verify_nin(
            nin=nin,
            first_name=first_name,
            surname=surname,
        )

    async def verify_cac(
        self,
        cac_number: str,
        business_name: str,
    ):
        from app.services.qoreid_service import QoreIDService

        return await QoreIDService.verify_cac(
            cac_number=cac_number,
            business_name=business_name,
        )

    async def verify_drivers_licence(
        self,
        licence_number: str,
        first_name: str,
        surname: str,
    ):
        from app.services.qoreid_service import QoreIDService

        return await QoreIDService.verify_drivers_licence(
            licence_number=licence_number,
            first_name=first_name,
            surname=surname,
        )

    async def verify_vehicle_plate(
        self,
        plate_number: str,
    ):
        from app.services.qoreid_service import QoreIDService

        return await QoreIDService.verify_license_plate(
            plate_number=plate_number,
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
        vehicle_result, vehicle_ref, vehicle_data = await self.verify_vehicle_plate(
    data.vehicle_registration
     )

        vehicle_status = BothRolesVerificationStatus(vehicle_result)

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
