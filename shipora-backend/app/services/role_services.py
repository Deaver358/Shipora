from app.schema.role_schema import VendorCreate, DispatcherCreate, BothRolesCreate
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.vendor_model import Vendor
from app.models.dispatcher_model import Dispatcher
from app.models.both_roles_model import BothRoles
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


    async def create_vendor(self, data: VendorCreate, session: AsyncSession):
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
    
        # --------------------------------------------------------
        # VERIFY CAC
        # --------------------------------------------------------
    
        # If your vendor requires CAC registration
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
    
        # --------------------------------------------------------
        # CREATE VENDOR
        # --------------------------------------------------------

        data_dict = data.model_dump()
        vendor = Vendor(**data_dict)
        session.add(vendor)
    
        await session.commit()
        await session.refresh(vendor)
    
        return vendor
    

    async def verify_nin(self, nin: str, first_name: str, surname: str) -> bool:

        if not nin:
            return False

        # TODO:
        # POST https://api.prembly.com/verification/vnin
        # Call your NIN verification provider here.
        #
        # Example:
        #
        # response = await nin_service.verify(
        #     nin=nin,
        #     first_name=first_name,
        #     surname=surname,
        # )
        #
        # return response.verified

        return True


    async def verify_cac(
        self,
        cac_number: str,
        business_name: str,
    ) -> bool:

        if not cac_number:
            return False

        # TODO:
        # POST https://api.prembly.com/verification/cac/basic
        # Call your CAC verification provider here.
        #
        # Example:
        #
        # response = await cac_service.verify(
        #     cac_number=cac_number,
        #     business_name=business_name,
        # )
        #
        # return response.verified

        return True


    async def verify_drivers_licence(self, licence_number: str, first_name: str, surname: str) -> bool:
        """
        Replace this with your driver's licence verification provider.
        """

        if not licence_number:
            return False

        # TODO:
        # Call your driver's licence verification provider.
        #
        # response = await licence_service.verify(
        #     licence_number=licence_number,
        #     first_name=first_name,
        #     surname=surname,
        # )
        #
        # return response.verified

        return True


    async def verify_vehicle_registration(registration_number: str) -> bool:
        """
        Replace this with your vehicle registration verification
        provider.
        """

        if not registration_number:
            return False

        # TODO:
        # Call your vehicle verification provider.
        #
        # response = await vehicle_service.verify(
        #     registration_number=registration_number,
        # )
        #
        # return response.verified

        return True


    async def create_dispatcher(self, data: DispatcherCreate, session: AsyncSession):
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
    
        vehicle_verified = await self.verify_vehicle_registration(
            registration_number=data.vehicle_registration
        )
    
        if not vehicle_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle registration verification failed.",
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
        dispatcher = Dispatcher(**data_dict)
    
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


    async def create_both_roles(self, data: BothRolesCreate, session: AsyncSession):

        email_in_vendor = await self.vendor_withemail_exists(email=data.email, vendor=True, session=session)
        email_in_dispatcher = await self.vendor_withemail_exists(email=data.email, vendor=False, session=session)
        email_in_both = await self.both_withemail_exists(email=data.email, session=session)

        if email_in_vendor or email_in_dispatcher or email_in_both:
            return "Email already exists"

        phone_in_vendor = await self.vendor_withphone_exists(phone=data.phone, vendor=True, session=session)
        phone_in_dispatcher = await self.vendor_withphone_exists(phone=data.phone, vendor=False, session=session)
        phone_in_both = await self.both_withphone_exists(phone=data.phone, session=session)

        if phone_in_vendor or phone_in_dispatcher or phone_in_both:
            return "Phone number already exists"

        nin_in_vendor = await self.vendor_withnin_exists(nin=data.nin, vendor=True, session=session)
        nin_in_dispatcher = await self.vendor_withnin_exists(nin=data.nin, vendor=False, session=session)
        nin_in_both = await self.both_withnin_exists(nin=data.nin, session=session)

        if nin_in_vendor or nin_in_dispatcher or nin_in_both:
            return "Nin already exists"

        cac_in_vendor = await self.vendor_withcac_exists(cac=data.cac_number, vendor=True, session=session)
        cac_in_dispatcher = await self.vendor_withcac_exists(cac=data.cac_number, vendor=True, session=session)
        cac_in_both = await self.both_withcac_exists(cac=data.cac, session=session)

        if cac_in_vendor or cac_in_dispatcher or cac_in_both:
            return "Cac already exists"


        # ========================================================
        # VEHICLE REGISTRATION
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
    
        vehicle_verified = await self.verify_vehicle_registration(
            registration_number=data.vehicle_registration
        )
    
        if not vehicle_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle registration verification failed.",
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
        # CREATE DISPATCHER
        # ========================================================
        data_dict = data.model_dump()
        bothroles = BothRoles(**data_dict)
    
        session.add(bothroles)
    
        await session.commit()
        await session.refresh(bothroles)
    
        return bothroles 
    



