from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import text
from app.core.session_config import engine, AsyncSessionLocal
from sqlmodel import SQLModel
from middleware_config import register_sessionMiddleware
from app.utils.path import static_files_path
from app.routes.auth_routers import router as auth_router
from app.routes.verifyRoute import dispatcher_router, vendor_router, both_router
from app.routes.shipment_routers import router as shipment_router
from app.routes.rating_routers import router as rating_router
from app.routes.availability_routers import router as availability_router
from app.routes.admin_routers import router as admin_router
from app.routes.upload_routers import router as upload_router
from app.routes.notification_routers import router as notification_router
from app.routes.profile_routers import router as profile_router
from app.routes.wallet_routers import router as wallet_router
from app.services.shipment_services import ShipmentService

# Import every model so SQLModel metadata contains every table.
from app.models.user_model import User
from app.models.vendor_model import Vendor
from app.models.dispatcher_model import Dispatcher
from app.models.both_roles_model import BothRoles
from app.models.shipment_model import Shipment
from app.models.application_model import Application
from app.models.rating_model import Rating
from app.models.wallet_transaction_model import WalletTransaction
from app.models.dispatch_availability_model import DispatchAvailability
from app.models.notification_model import Notification

version = "v1.0"
scheduler = AsyncIOScheduler()
shipment_service = ShipmentService()


async def sync_existing_schema():
    """Add only the new Shipora columns needed by this backend. Existing data is preserved."""
    statements = [
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_number VARCHAR",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS public_token VARCHAR",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_address VARCHAR",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_city VARCHAR",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_region VARCHAR",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_postal_code VARCHAR",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_lat DOUBLE PRECISION",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_lng DOUBLE PRECISION",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS current_location VARCHAR",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dispute_reason VARCHAR",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dispute_resolution VARCHAR",
        "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMPTZ",
        "ALTER TABLE shipments ALTER COLUMN recipient_name DROP NOT NULL",
        "ALTER TABLE shipments ALTER COLUMN recipient_phone DROP NOT NULL",
        """UPDATE shipments SET tracking_number = 'SHP-' || upper(substr(md5(shipment_id::text), 1, 10))
           WHERE tracking_number IS NULL OR tracking_number = ''""",
        """UPDATE shipments SET public_token = md5(shipment_id::text || '-shipora-public')
           WHERE public_token IS NULL OR public_token = ''""",
        "ALTER TABLE shipments ALTER COLUMN tracking_number SET NOT NULL",
        "ALTER TABLE shipments ALTER COLUMN public_token SET NOT NULL",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_shipments_tracking_number ON shipments (tracking_number)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_shipments_public_token ON shipments (public_token)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR",
        "ALTER TABLE dispatchers ADD COLUMN IF NOT EXISTS account_name VARCHAR",
        "ALTER TABLE both_roles ADD COLUMN IF NOT EXISTS account_name VARCHAR",
        # wallet_transactions.shipment_id must be nullable now — a WITHDRAWAL row isn't tied to a shipment
        "ALTER TABLE wallet_transactions ALTER COLUMN shipment_id DROP NOT NULL",
        # add the new enum value used by wallet withdrawals (no-op if it already exists)
        "ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'withdrawal'",
        # vendors can now fund a Shipora balance and withdraw unspent balance, same as dispatchers
        "ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'topup'",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_code VARCHAR",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_number VARCHAR",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_name VARCHAR",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS paystack_recipient_code VARCHAR",
    ]
    async with engine.begin() as conn:
        for statement in statements:
            try:
                await conn.execute(text(statement))
            except Exception as exc:
                # Keep startup resilient when a legacy database has already applied part of the sync.
                print(f"Schema sync skipped: {statement[:70]}... -> {exc}")


async def init_db():
    try:
        await sync_existing_schema()
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        print("Database connection okay")
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise


async def run_auto_release_sweep():
    async with AsyncSessionLocal() as db_session:
        released = await shipment_service.auto_release_sweep(db_session)
        if released:
            print(f"Auto-released escrow for {released} shipment(s)")


@asynccontextmanager
async def life_span(app: FastAPI):
    print("Shipora starting")
    await init_db()
    scheduler.add_job(run_auto_release_sweep, "interval", minutes=15, id="auto_release_sweep", replace_existing=True)
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    print("Scheduler stopped")


app = FastAPI(title="Shipora", version=version, description="Shipora Logistics & Forwarding API", lifespan=life_span)
API_PREFIX = f"/api/{version}"

register_sessionMiddleware(app)
app.mount("/static", StaticFiles(directory=static_files_path), name="static")

app.include_router(auth_router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
app.include_router(dispatcher_router, prefix=f"{API_PREFIX}/dispatcher", tags=["Dispatcher"])
app.include_router(vendor_router, prefix=f"{API_PREFIX}/vendor", tags=["Vendor"])
app.include_router(both_router, prefix=f"{API_PREFIX}/bothroles", tags=["Bothroles"])
app.include_router(shipment_router, prefix=f"{API_PREFIX}/shipments", tags=["Shipments"])
app.include_router(availability_router, prefix=f"{API_PREFIX}/availability", tags=["Dispatch Availability"])
app.include_router(admin_router, prefix=f"{API_PREFIX}/admin", tags=["Admin"])
app.include_router(upload_router, prefix=f"{API_PREFIX}/uploads", tags=["Uploads"])
app.include_router(rating_router, prefix=f"{API_PREFIX}/ratings", tags=["Ratings"])
app.include_router(notification_router, prefix=f"{API_PREFIX}/notifications", tags=["Notifications"])
app.include_router(profile_router, prefix=f"{API_PREFIX}/profile", tags=["Profile"])
app.include_router(wallet_router, prefix=f"{API_PREFIX}/wallet", tags=["Wallet"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "shipora", "version": version}
