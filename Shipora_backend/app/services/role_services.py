from app.schema.role_schema import VendorCreate, DispatcherCreate, BothRolesCreate
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.vendor_model import Vendor, VerificationStatus as VendorVerificationStatus
from app.models.dispatcher_model import Dispatcher, VerificationStatus as DispatcherVerificationStatus
from app.models.both_roles_model import BothRoles, VerificationStatus as BothRolesVerificationStatus
from sqlalchemy import select
from fastapi.exceptions import HTTPException
from fastapi import status

class RoleService:


    async def vendor_withemail_exists(self, email: str, vendor: bool, session: AsyncSession):
        model = Vendor if vendor else Dispatcher
        email_result = await session.execute(
            select(model).where(
                model.email == email
            )
        )
        existing_email = email_result.scalar_one_or_none()
        return existing_email


    async def vendor_withphone_exists(self, phone: str, vendor: bool, session: AsyncSession):
        model = Vendor if vendor else Dispatcher
        phone_result = await session.execute(
            select(model).where(
                model.phone == phone
            )
        )
        existing_phone = phone_result.scalar_one_or_none()
        return existing_phone


    async def vendor_withnin_exists(self, nin: str, vendor: bool, session: AsyncSession):
        model = Vendor if vendor else Dispatcher
        nin_result = await session.execute(
            select(model).where(
                model.nin == nin
            )
        )
        existing_nin = nin_result.scalar_one_or_none()
        return existing_nin


    async def vendor_withcac_exists(self, cac: str, vendor: bool, session: AsyncSession):
        model = Vendor if vendor else Dispatcher
        cac_result = await session.execute(
            select(model).where(
                model.cac_number == cac
            )
        )
        existing_cac = cac_result.scalar_one_or_none()
        return existing_cac


    async def create_vendor(self, data: VendorCreate, user_id, session: AsyncSession):
        # a user can only verify as a vendor once
        existing_for_user = await session.execute(
            select(Vendor).where(Vendor.user_id == user_id)
        )
        if existing_for_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This account has already been verified as a vendor.",
            )

        existing_email = await self.vendor_withemail_exists(email=data.email, vendor=True, session=session)
    
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A vendor with this email already exists.",
            )
    
        # --------------------------------------------------------
        # Check phone
        # --------------------------------------------------------
    
        existing_phone = await self.vendor_withphone_exists(phone=data.phone, vendor=True, session=session)


        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A vendor with this phone number already exists.",
            )
    
        # --------------------------------------------------------
        # Check NIN already registered
        # --------------------------------------------------------
    
        existing_nin = await self.vendor_withnin_exists(nin=data.nin, vendor=True, session=session)
    
    
        if existing_nin:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This NIN is already registered.",
            )
    
        # --------------------------------------------------------
        # VERIFY NIN
        # --------------------------------------------------------
    
        nin_verified = await self.verify_nin(
            nin=data.nin,
            first_name=data.first_name,
            surname=data.surname,
        )
    
        if not nin_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="NIN verification failed.",
            )

        nin_status = VendorVerificationStatus.VERIFIED
    
        # --------------------------------------------------------
        # VERIFY CAC
        # --------------------------------------------------------
    
        # If your vendor requires CAC registration
        cac_status = VendorVerificationStatus.PENDING
        if data.cac_number:
    
            existing_cac = await self.vendor_withcac_exists(cac=data.cac_number, vendor=True, session=session)
    
            if existing_cac:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This CAC number is already registered.",
                )
    
            cac_verified = await self.verify_cac(
                cac_number=data.cac_number,
                business_name=data.business_name,
            )
    
            if not cac_verified:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CAC verification failed.",
                )

            cac_status = VendorVerificationStatus.VERIFIED
    
        # --------------------------------------------------------
        # CREATE VENDOR
        # --------------------------------------------------------

        data_dict = data.model_dump()
        vendor = Vendor(
            **data_dict,
            user_id=user_id,
            nin_verification_status=nin_status,
            nin_verification_ref=f"stub:{data.nin}",
            cac_verification_status=cac_status,
            cac_verification_ref=f"stub:{data.cac_number}" if data.cac_number else None,
        )
        session.add(vendor)
    
        await session.commit()
        await session.refresh(vendor)
    
        return vendor
    

    async def _provider_verify(self, endpoint: str, payload: dict) -> tuple[bool, str | None]:
        from app.utils.config import settings
        import httpx
        if not endpoint:
            if settings.KYC_STRICT:
                return False, None
            return True, "development-bypass"
        headers = {"Authorization": f"Bearer {settings.KYC_PROVIDER_API_KEY}"} if settings.KYC_PROVIDER_API_KEY else {}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            body = response.json()
        verified = bool(body.get("verified") or body.get("status") in ("verified", "success") or body.get("data", {}).get("verified"))
        ref = body.get("reference") or body.get("id") or body.get("data", {}).get("reference") or body.get("data", {}).get("id")
        return verified, ref

    async def verify_nin(self, nin: str, first_name: str, surname: str) -> bool:
        from app.utils.config import settings
        if not nin:
            return False
        endpoint = f"{settings.KYC_PROVIDER_BASE_URL.rstrip('/')}/nin" if settings.KYC_PROVIDER_BASE_URL else ""
        ok, _ = await self._provider_verify(endpoint, {"nin": nin, "first_name": first_name, "surname": surname})
        return ok

    async def verify_cac(self, cac_number: str, business_name: str) -> bool:
        from app.utils.config import settings
        if not cac_number:
            return False
        endpoint = f"{settings.KYC_PROVIDER_BASE_URL.rstrip('/')}/cac" if settings.KYC_PROVIDER_BASE_URL else ""
        ok, _ = await self._provider_verify(endpoint, {"cac_number": cac_number, "business_name": business_name})
        return ok

    async def verify_drivers_licence(self, licence_number: str, first_name: str, surname: str) -> bool:
        from app.utils.config import settings
        if not licence_number:
            return False
        endpoint = f"{settings.KYC_PROVIDER_BASE_URL.rstrip('/')}/drivers-license" if settings.KYC_PROVIDER_BASE_URL else ""
        ok, _ = await self._provider_verify(endpoint, {"licence_number": licence_number, "first_name": first_name, "surname": surname})
        return ok

    async def create_dispatcher(self, data: DispatcherCreate, user_id, session: AsyncSession):
        # ========================================================
        # ONE PROFILE PER ACCOUNT
        # ========================================================

        existing_for_user = await session.execute(
            select(Dispatcher).where(Dispatcher.user_id == user_id)
        )
        if existing_for_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This account has already been verified as a dispatcher.",
            )

        # ========================================================
        # BASIC DUPLICATE CHECKS
        # ========================================================
    
        # Email
        result = await self.vendor_withemail_exists(email=data.email, vendor=False, session=session)
        if result:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A dispatcher with this email already exists.",
            )
    
        # Phone
        result = await self.vendor_withphone_exists(phone=data.phone, vendor=False, session=session)
        if result:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A dispatcher with this phone number already exists.",
            )
    
        # NIN
        result = await self.vendor_withnin_exists(nin=data.nin, vendor=False, session=session)
    
        if result:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This NIN is already registered.",
            )
    
        # ========================================================
        # VERIFY NIN
        # ========================================================
    
        nin_verified = await self.verify_nin(
            nin=data.nin,
            first_name=data.first_name,
            surname=data.surname,
        )
    
        if not nin_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="NIN verification failed.",
            )
    
        # ========================================================
        # VEHICLE REGISTRATION
        # ========================================================
        # No automated provider covers plate/vehicle ownership lookups in
        # Nigeria today, so this always goes to manual admin review rather
        # than gating signup. The dispatcher can verify NIN instantly and
        # start browsing, but can't accept jobs until vehicle docs clear
        # review (enforced in the shipment service, not here).
    
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
    
        # ========================================================
        # DRIVER-SPECIFIC VERIFICATION
        # ========================================================
    
        if data.is_driver:
    
            # ----------------------------------------------------
            # Licence number is required
            # ----------------------------------------------------
    
            if not data.licence_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Driver's licence number is required "
                        "when registering as a driver."
                    ),
                )
    
            # ----------------------------------------------------
            # Check duplicate licence
            # ----------------------------------------------------
    
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
    
            # ----------------------------------------------------
            # Verify driver's licence
            # ----------------------------------------------------
    
            licence_verified = await self.verify_drivers_licence(
                licence_number=data.licence_number,
                first_name=data.first_name,
                surname=data.surname,
            )
    
            if not licence_verified:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Driver's licence verification failed.",
                )
    
        # ========================================================
        # CREATE DISPATCHER
        # ========================================================
        data_dict = data.model_dump()
        dispatcher = Dispatcher(
            **data_dict,
            user_id=user_id,
            nin_verification_status=DispatcherVerificationStatus.VERIFIED,
            nin_verification_ref=f"stub:{data.nin}",
            vehicle_verification_status=DispatcherVerificationStatus.PENDING,
        )
    
        session.add(dispatcher)
    
        await session.commit()
        await session.refresh(dispatcher)
    
        return dispatcher



    async def both_withemail_exists(self, email: str, session: AsyncSession):
        email_result = await session.execute(
            select(BothRoles).where(
                BothRoles.email == email
            )
        )
        existing_email = email_result.scalar_one_or_none()
        return existing_email
    
    
    async def both_withphone_exists(self, phone: str, session: AsyncSession):
        phone_result = await session.execute(
            select(BothRoles).where(
                BothRoles.phone == phone
            )
        )
        existing_phone = phone_result.scalar_one_or_none()
        return existing_phone


    async def both_withnin_exists(self, nin: str, session: AsyncSession):
        nin_result = await session.execute(
            select(BothRoles).where(
                BothRoles.nin == nin
            )
        )
        existing_nin = nin_result.scalar_one_or_none()
        return existing_nin
    
    
    async def both_withcac_exists(self, cac: str, session: AsyncSession):
        cac_result = await session.execute(
            select(BothRoles).where(
                BothRoles.cac_number == cac
            )
        )
        existing_cac = cac_result.scalar_one_or_none()
        return existing_cac


    async def create_both_roles(self, data: BothRolesCreate, user_id, session: AsyncSession):

        existing_for_user = await session.execute(
            select(BothRoles).where(BothRoles.user_id == user_id)
        )
        if existing_for_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This account has already been verified.",
            )

        email_in_vendor = await self.vendor_withemail_exists(email=data.email, vendor=True, session=session)
        email_in_dispatcher = await self.vendor_withemail_exists(email=data.email, vendor=False, session=session)
        email_in_both = await self.both_withemail_exists(email=data.email, session=session)

        if email_in_vendor or email_in_dispatcher or email_in_both:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

        phone_in_vendor = await self.vendor_withphone_exists(phone=data.phone, vendor=True, session=session)
        phone_in_dispatcher = await self.vendor_withphone_exists(phone=data.phone, vendor=False, session=session)
        phone_in_both = await self.both_withphone_exists(phone=data.phone, session=session)

        if phone_in_vendor or phone_in_dispatcher or phone_in_both:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already exists")

        nin_in_vendor = await self.vendor_withnin_exists(nin=data.nin, vendor=True, session=session)
        nin_in_dispatcher = await self.vendor_withnin_exists(nin=data.nin, vendor=False, session=session)
        nin_in_both = await self.both_withnin_exists(nin=data.nin, session=session)

        if nin_in_vendor or nin_in_dispatcher or nin_in_both:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="NIN already exists")

        cac_in_vendor = await self.vendor_withcac_exists(cac=data.cac_number, vendor=True, session=session)
        cac_in_dispatcher = await self.vendor_withcac_exists(cac=data.cac_number, vendor=False, session=session)
        cac_in_both = await self.both_withcac_exists(cac=data.cac_number, session=session)

        if cac_in_vendor or cac_in_dispatcher or cac_in_both:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CAC number already exists")

        nin_verified = await self.verify_nin(
            nin=data.nin,
            first_name=data.first_name,
            surname=data.surname,
        )
        if not nin_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="NIN verification failed.",
            )

        cac_verified = await self.verify_cac(
            cac_number=data.cac_number,
            business_name=data.business_name,
        )
        if not cac_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CAC verification failed.",
            )


        # ========================================================
        # VEHICLE REGISTRATION — manual review, not a signup gate
        # (see note in create_dispatcher)
        # ========================================================
    
        result = await session.execute(
            select(Dispatcher).where(
                Dispatcher.vehicle_registration
                == data.vehicle_registration
            )
        )

        result_ = await session.execute(
            select(BothRoles).where(
                BothRoles.vehicle_registration
                == data.vehicle_registration
            )
        )
        
    
        if result.scalar_one_or_none() or result_.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This vehicle registration is already registered.",
            )
    
        # ========================================================
        # DRIVER-SPECIFIC VERIFICATION
        # ========================================================
    
        if data.is_driver:
    
            # ----------------------------------------------------
            # Licence number is required
            # ----------------------------------------------------
    
            if not data.licence_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Driver's licence number is required "
                        "when registering as a driver."
                    ),
                )
    
            # ----------------------------------------------------
            # Check duplicate licence
            # ----------------------------------------------------
    
            result = await session.execute(
                select(Dispatcher).where(
                    Dispatcher.licence_number
                    == data.licence_number
                )
            )

            result_ = await session.execute(
                select(BothRoles).where(
                    BothRoles.licence_number
                    == data.licence_number
                )
            )
    
            if result.scalar_one_or_none() or result_.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This driver's licence is already registered.",
                )
    
            # ----------------------------------------------------
            # Verify driver's licence
            # ----------------------------------------------------
    
            licence_verified = await self.verify_drivers_licence(
                licence_number=data.licence_number,
                first_name=data.first_name,
                surname=data.surname,
            )
    
            if not licence_verified:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Driver's licence verification failed.",
                )

        # ========================================================
        # CREATE BOTH ROLES PROFILE
        # ========================================================
        data_dict = data.model_dump()
        bothroles = BothRoles(
            **data_dict,
            user_id=user_id,
            nin_verification_status=BothRolesVerificationStatus.VERIFIED,
            nin_verification_ref=f"stub:{data.nin}",
            cac_verification_status=BothRolesVerificationStatus.VERIFIED,
            cac_verification_ref=f"stub:{data.cac_number}",
            vehicle_verification_status=BothRolesVerificationStatus.PENDING,
        )
    
        session.add(bothroles)
    
        await session.commit()
        await session.refresh(bothroles)
    
        return bothroles 
    



