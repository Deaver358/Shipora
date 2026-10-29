import asyncio
import re
import uuid
from functools import lru_cache
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.dependencies import get_authenticated_user, get_this_user
from app.models.user_model import User
from app.models.dispatcher_model import Dispatcher
from app.models.both_roles_model import BothRoles
from app.core.session_config import session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.config import settings

router = APIRouter()

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
DOCUMENT_TYPES = IMAGE_TYPES | {"application/pdf"}
SHIPMENT_MEDIA_TYPES = IMAGE_TYPES | {"image/gif", "video/mp4", "video/quicktime", "video/webm"}


@lru_cache(maxsize=1)
def _r2_client():
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY,
        aws_secret_access_key=settings.R2_SECRET_KEY,
        region_name="auto",
        config=Config(retries={"max_attempts": 3, "mode": "standard"}, connect_timeout=10, read_timeout=60),
    )


def _safe_name(filename: str | None) -> str:
    name = Path(filename or "upload").name
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-.") or "upload"
    return name[-80:]


async def _upload(file: UploadFile, folder: str, allowed_types: set[str] = DOCUMENT_TYPES) -> str:
    if not settings.R2_ACCESS_KEY or not settings.R2_SECRET_KEY or not settings.R2_ENDPOINT_URL or not settings.BUCKET_NAME:
        raise HTTPException(503, "R2 storage is not configured.")
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Unsupported file type.")
    max_bytes = settings.UPLOAD_MAX_MB * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(413, f"File is too large (max {settings.UPLOAD_MAX_MB} MB).")
    try:
        client = _r2_client()
    except ImportError:
        raise HTTPException(500, "boto3 is not installed.")
    key = f"{folder}/{uuid.uuid4().hex}-{_safe_name(file.filename)}"
    try:
        # boto3 is blocking — keep it off the event loop
        await asyncio.to_thread(
            client.put_object,
            Bucket=settings.BUCKET_NAME,
            Key=key,
            Body=data,
            ContentType=file.content_type,
        )
    except Exception:
        raise HTTPException(502, "Could not store the file right now. Please try again.")
    if not settings.R2_PUBLIC_BASE_URL:
        return key
    return f"{settings.R2_PUBLIC_BASE_URL.rstrip('/')}/{key}"


@router.post("/shipment-media")
async def upload_shipment_media(file: UploadFile = File(...), user: User = Depends(get_this_user)):
    return {"url": await _upload(file, f"shipments/{user.uid}", SHIPMENT_MEDIA_TYPES)}

@router.delete("/avatar")
async def delete_avatar(
    user: User = Depends(get_authenticated_user),
    session: AsyncSession = Depends(session),
):
    from app.models.user_model import User as UserModel

    result = await session.execute(
        select(UserModel).where(UserModel.uid == user.uid)
    )

    row = result.scalar_one_or_none()

    if not row:
        raise HTTPException(404, "User not found.")

    if not row.avatar_url:
        return {"message": "Profile picture removed.", "url": None}

    # Delete the R2 object when the stored value is a public URL.
    try:
        if (
            settings.R2_ACCESS_KEY
            and settings.R2_SECRET_KEY
            and settings.R2_ENDPOINT_URL
            and settings.BUCKET_NAME
        ):
            prefix = settings.R2_PUBLIC_BASE_URL.rstrip("/") + "/"

            if row.avatar_url.startswith(prefix):
                key = row.avatar_url[len(prefix):]

                await asyncio.to_thread(
                    _r2_client().delete_object,
                    Bucket=settings.BUCKET_NAME,
                    Key=key,
                )

    except Exception:
        # Do not prevent the database avatar from being cleared
        # if R2 cleanup fails.
        pass

    row.avatar_url = None

    session.add(row)
    await session.commit()

    return {
        "message": "Profile picture removed.",
        "url": None,
    }


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_authenticated_user),
    session: AsyncSession = Depends(session)
):
    from app.models.user_model import User as UserModel

    url = await _upload(file, f"avatars/{user.uid}", IMAGE_TYPES)
    result = await session.execute(select(UserModel).where(UserModel.uid == user.uid))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(404, "User not found.")
    row.avatar_url = url
    session.add(row)
    await session.commit()
    return {"url": url}


@router.post("/vehicle-document")
async def upload_vehicle_document(file: UploadFile = File(...), user: User = Depends(get_this_user), session: AsyncSession = Depends(session)):
    result = await session.execute(select(Dispatcher).where(Dispatcher.user_id == user.uid))
    profile = result.scalar_one_or_none()
    if not profile:
        result = await session.execute(select(BothRoles).where(BothRoles.user_id == user.uid))
        profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Dispatcher profile not found.")

    url = await _upload(file, f"vehicle-kyc/{user.uid}")
    profile.vehicle_document_url = url
    # A new document puts a rejected / pending vehicle back in the admin queue
    if getattr(profile.vehicle_verification_status, "value", profile.vehicle_verification_status) != "verified":
        profile.vehicle_verification_status = type(profile.vehicle_verification_status)("review_required")
        profile.vehicle_rejection_reason = None
    session.add(profile)
    await session.commit()
    return {"url": url, "message": "Vehicle document uploaded and queued for review."}
