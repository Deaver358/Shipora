from app.utils.logging_config import setup_logging

setup_logging()

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError, DBAPIError
from app.core.session_config import engine, AsyncSessionLocal
from sqlmodel import SQLModel
from middleware_config import register_sessionMiddleware
from app.utils.config import settings
from app.utils.path import static_files_path
from app.utils.paystack import PaystackError
from app.utils import redis as redis_utils
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
from app.routes.dispute_routers import router as dispute_router

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
from app.models.dispute_model import Dispute

version = "v1.0"
scheduler = AsyncIOScheduler()
shipment_service = ShipmentService()
logger = logging.getLogger("shipora")

# Arbitrary constants for Postgres advisory locks shared by every worker
SCHEMA_LOCK_KEY = 728_401_001
SWEEP_LOCK_KEY = 728_401_002

# Enum values added after the first release. ALTER TYPE ... ADD VALUE must
# run outside a transaction block, so they are applied separately.
ENUM_VALUES = [
    ("transactiontype", "withdrawal"),
    ("transactiontype", "topup"),
    ("transactiontype", "customer_payment"),
]


async def sync_existing_schema(conn):
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
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_code VARCHAR",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_number VARCHAR",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_name VARCHAR",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS paystack_recipient_code VARCHAR",
        # CAC and business email are optional for "both roles" profiles
        "ALTER TABLE both_roles ALTER COLUMN cac_number DROP NOT NULL",
        "ALTER TABLE both_roles ALTER COLUMN business_email DROP NOT NULL",
        # Blank CACs / licences were stored as '' and collide on the unique index
        "UPDATE vendors SET cac_number = NULL WHERE cac_number = ''",
        "UPDATE both_roles SET cac_number = NULL WHERE cac_number = ''",
        "UPDATE dispatchers SET licence_number = NULL WHERE licence_number = ''",
        "UPDATE both_roles SET licence_number = NULL WHERE licence_number = ''",
        # Hot query paths
        "CREATE INDEX IF NOT EXISTS ix_wallet_transactions_user_type ON wallet_transactions (user_id, type, status)",
        "CREATE INDEX IF NOT EXISTS ix_notifications_user_created ON notifications (user_id, created_at DESC)",
        "CREATE INDEX IF NOT EXISTS ix_shipments_status_created ON shipments (status, created_at DESC)",
    ]

    for statement in statements:
        # Each statement in its own savepoint: one failure must not abort the
        # rest of the sync (it used to skip every statement after the first error).
        try:
            async with conn.begin_nested():
                await conn.execute(text(statement))
        except Exception as exc:
            logger.warning("Schema sync skipped: %s... -> %s", " ".join(statement.split())[:70], exc)


async def add_enum_values():
    autocommit_engine = engine.execution_options(isolation_level="AUTOCOMMIT")
    async with autocommit_engine.connect() as conn:
        for enum_name, value in ENUM_VALUES:
            try:
                await conn.execute(text(f"ALTER TYPE {enum_name} ADD VALUE IF NOT EXISTS '{value}'"))
            except Exception as exc:
                logger.warning("Enum sync skipped: %s.%s -> %s", enum_name, value, exc)


async def init_db():
    try:
        async with engine.begin() as conn:
            # Only one worker/instance runs the schema sync at a time.
            await conn.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": SCHEMA_LOCK_KEY})
            # Create missing tables first (fresh database), then patch legacy ones.
            await conn.run_sync(SQLModel.metadata.create_all)
            await sync_existing_schema(conn)
        await add_enum_values()
        logger.info("Database connection okay")
    except Exception as e:
        logger.exception("Database connection failed: %s", e)
        raise


async def run_auto_release_sweep():
    try:
        async with AsyncSessionLocal() as db_session:
            # With several workers / instances, only one runs the sweep.
            got_lock = (await db_session.execute(
                text("SELECT pg_try_advisory_lock(:k)"), {"k": SWEEP_LOCK_KEY}
            )).scalar()
            if not got_lock:
                return
            try:
                released = await shipment_service.auto_release_sweep(db_session)
                if released:
                    logger.info("Auto-released escrow for %s shipment(s)", released)
            finally:
                await db_session.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": SWEEP_LOCK_KEY})
                await db_session.commit()
    except Exception:
        logger.exception("Auto-release sweep failed")


@asynccontextmanager
async def life_span(app: FastAPI):
    logger.info("Shipora starting (%s)", settings.ENVIRONMENT)
    static_files_path.mkdir(parents=True, exist_ok=True)
    await init_db()
    if not await redis_utils.ping():
        logger.warning("Redis is not reachable at startup — sessions fall back to JWT-only validation.")
    scheduler.add_job(
        run_auto_release_sweep,
        "interval",
        minutes=15,
        id="auto_release_sweep",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    try:
        await redis_utils.redis_client.aclose()
    except Exception:
        pass
    await engine.dispose()
    logger.info("Scheduler stopped")


app = FastAPI(
    title="Shipora",
    version=version,
    description="Shipora Logistics & Forwarding API",
    lifespan=life_span,
)

class CatchAllErrorsMiddleware:
    """
    Turns unexpected exceptions into a JSON 500. It sits *inside* the CORS
    middleware so even error responses carry CORS headers — otherwise the
    browser reports a confusing CORS failure instead of the real error.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        response_started = False

        async def send_wrapper(message):
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            if response_started:
                raise
            logger.exception("Unhandled error on %s %s", scope.get("method"), scope.get("path"))
            if isinstance(exc, (DBAPIError, OSError)) and "connect" in str(exc).lower():
                response = JSONResponse(status_code=503, content={"detail": "Service temporarily unavailable. Please try again shortly."})
            else:
                response = JSONResponse(status_code=500, content={"detail": "Something went wrong on our side. Please try again."})
            await response(scope, receive, send)


app.add_middleware(CatchAllErrorsMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = f"/api/{version}"

register_sessionMiddleware(app)
static_files_path.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_files_path), name="static")


# ============================================================
# ERROR HANDLING — always answer JSON with a useful "detail"
# ============================================================

@app.exception_handler(PaystackError)
async def paystack_error_handler(request: Request, exc: PaystackError):
    logger.warning("Paystack error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(status_code=502, content={"detail": str(exc) or "Payment provider error. Please try again."})


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.warning("Integrity error on %s %s: %s", request.method, request.url.path, exc.orig)
    return JSONResponse(status_code=409, content={"detail": "This record conflicts with existing data (it may already exist)."})


@app.exception_handler(OperationalError)
async def db_unavailable_handler(request: Request, exc: OperationalError):
    logger.error("Database unavailable on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(status_code=503, content={"detail": "Service temporarily unavailable. Please try again shortly."})


app.include_router(auth_router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
app.include_router(dispatcher_router, prefix=f"{API_PREFIX}/dispatcher", tags=["Dispatcher"])
app.include_router(vendor_router, prefix=f"{API_PREFIX}/vendor", tags=["Vendor"])
app.include_router(both_router, prefix=f"{API_PREFIX}/bothroles", tags=["Bothroles"])
# Alias: the frontend's "both roles" form posts to /both/verify
app.include_router(both_router, prefix=f"{API_PREFIX}/both", tags=["Bothroles"], include_in_schema=False)
app.include_router(shipment_router, prefix=f"{API_PREFIX}/shipments", tags=["Shipments"])
app.include_router(availability_router, prefix=f"{API_PREFIX}/availability", tags=["Dispatch Availability"])
app.include_router(admin_router, prefix=f"{API_PREFIX}/admin", tags=["Admin"])
app.include_router(upload_router, prefix=f"{API_PREFIX}/uploads", tags=["Uploads"])
app.include_router(rating_router, prefix=f"{API_PREFIX}/ratings", tags=["Ratings"])
app.include_router(notification_router, prefix=f"{API_PREFIX}/notifications", tags=["Notifications"])
app.include_router(profile_router, prefix=f"{API_PREFIX}/profile", tags=["Profile"])
app.include_router(wallet_router, prefix=f"{API_PREFIX}/wallet", tags=["Wallet"])

app.include_router(
    dispute_router,
    prefix=f"{API_PREFIX}/disputes",
    tags=["Disputes"],
)


@app.get("/")
async def root():
    return {"service": "shipora", "version": version, "docs": "/docs"}


@app.get("/health")
async def health():
    """Liveness: the process is up."""
    return {"status": "ok", "service": "shipora", "version": version}


@app.get("/health/ready")
async def readiness():
    """Readiness: dependencies are reachable (use for load balancer health checks)."""
    checks = {}
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        logger.warning("Readiness DB check failed: %s", exc)
        checks["database"] = "unavailable"

    checks["redis"] = "ok" if await redis_utils.ping() else "unavailable"

    healthy = checks["database"] == "ok"
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={"status": "ok" if healthy else "degraded", "checks": checks, "version": version},
    )
