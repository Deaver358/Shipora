import uuid
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


async def _upload(file: UploadFile, folder: str) -> str:
    if not settings.R2_ACCESS_KEY or not settings.R2_SECRET_KEY or not settings.R2_ENDPOINT_URL or not settings.BUCKET_NAME:
        raise HTTPException(503, "R2 storage is not configured.")
    if file.content_type not in {"image/jpeg", "image/png", "image/webp", "application/pdf"}:
        raise HTTPException(400, "Unsupported file type.")
    max_bytes = settings.UPLOAD_MAX_MB * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(413, "File is too large.")
    try:
        import boto3
    except ImportError:
        raise HTTPException(500, "boto3 is not installed.")
    key = f"{folder}/{uuid.uuid4().hex}-{Path(file.filename or 'upload').name}"
    client = boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY,
        aws_secret_access_key=settings.R2_SECRET_KEY,
        region_name="auto",
    )
    client.put_object(Bucket=settings.BUCKET_NAME, Key=key, Body=data, ContentType=file.content_type)
    if not settings.R2_PUBLIC_BASE_URL:
        return key
    return f"{settings.R2_PUBLIC_BASE_URL.rstrip('/')}/{key}"


@router.post("/shipment-media")
async def upload_shipment_media(file: UploadFile = File(...), user: User = Depends(get_this_user)):
    return {"url": await _upload(file, f"shipments/{user.uid}")}

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
        import boto3

        if (
            settings.R2_ACCESS_KEY
            and settings.R2_SECRET_KEY
            and settings.R2_ENDPOINT_URL
            and settings.BUCKET_NAME
        ):
            prefix = settings.R2_PUBLIC_BASE_URL.rstrip("/") + "/"

            if row.avatar_url.startswith(prefix):
                key = row.avatar_url[len(prefix):]

                client = boto3.client(
                    "s3",
                    endpoint_url=settings.R2_ENDPOINT_URL,
                    aws_access_key_id=settings.R2_ACCESS_KEY,
                    aws_secret_access_key=settings.R2_SECRET_KEY,
                    region_name="auto",
                )

                client.delete_object(
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

    url = await _upload(file, f"avatars/{user.uid}")
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
    url = await _upload(file, f"vehicle-kyc/{user.uid}")
    result = await session.execute(select(Dispatcher).where(Dispatcher.user_id == user.uid))
    dispatcher = result.scalar_one_or_none()
    if dispatcher:
        dispatcher.vehicle_document_url = url
        session.add(dispatcher)
    else:
        result = await session.execute(select(BothRoles).where(BothRoles.user_id == user.uid))
        both = result.scalar_one_or_none()
        if not both:
            raise HTTPException(404, "Dispatcher profile not found.")
        both.vehicle_document_url = url
        session.add(both)
    await session.commit()
    return {"url": url, "message": "Vehicle document uploaded and queued for review."}
