from fastapi import (
    APIRouter,
    Depends,
    Request,
    Response,
    BackgroundTasks,
    status,
    Form,
)
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.templating import Jinja2Templates

from app.core.session_config import session
from app.core.dependencies import (
    AccessTokenBearer,
    RefreshTokenBearer,
    get_this_user,
)
from app.schema.auth_schema import SignUpModel, LoginModel, EmailRequest, PasswordResetConfirm
from app.schema.user import UserDataModel
from app.models.user_model import User, UserRole
from app.services.auth_services import AuthService, normalize_email
from app.utils.validators import (
    create_url_safe_token,
    create_access_token,
    create_refresh_token,
    decode_url_safe_token,
    decode_token,
)
from app.utils.mail import (
    send_email_verification_email,
    send_password_reset_email,
)
from app.utils.hash_password import verify_hash, hash_password
from app.utils.path import template_path
from app.utils.google import oauth
from app.utils.errors import UserNotFound, InvalidToken
from app.utils.redis import (
    store_access_token,
    store_refresh_token,
    del_access_token,
    del_refresh_token,
    add_jti_to_blocklist,
    REDIS_UNAVAILABLE_ERRORS,
)
from app.utils.config import settings
from app.utils.rate_limit import enforce as rate_limit

import asyncio
import hashlib
import hmac
import logging


router = APIRouter()
auth_service = AuthService()
logger = logging.getLogger("shipora.auth")

REFRESH_TOKEN_EXPIRY = 604800

template = Jinja2Templates(template_path)

VERIFY_PURPOSE = "verify"
RESET_PURPOSE = "reset"


# ============================================================
# HELPERS
# ============================================================

def _cookie_options() -> dict:
    options = dict(
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    if settings.COOKIE_DOMAIN:
        options["domain"] = settings.COOKIE_DOMAIN
    return options


def _set_auth_cookies(response: Response, access_token: str | None = None, refresh_token: str | None = None, refresh_max_age: int | None = None):
    options = _cookie_options()
    if refresh_token is not None:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=refresh_max_age,
            **options,
        )
    if access_token is not None:
        response.set_cookie(
            key="access_token",
            value=access_token,
            **options,
        )


def _clear_auth_cookies(response: Response):
    options = _cookie_options()
    options.pop("httponly", None)
    for key in ("access_token", "refresh_token"):
        response.delete_cookie(key=key, **options)


async def _issue_tokens(user: User, with_refresh: bool = True):
    user_data = {
        "email": str(user.email),
        "uid": str(user.uid),
    }

    access_token, access_payload = create_access_token(
        user_data=user_data,
    )

    refresh_token = refresh_payload = None
    if with_refresh:
        refresh_token, _jti, refresh_payload = create_refresh_token(
            user_data=user_data,
            expiry=REFRESH_TOKEN_EXPIRY,
            refresh=True,
        )

    # Store tokens under the USER UID because AccessTokenBearer and
    # RefreshTokenBearer look them up by the UID inside the token.
    try:
        await store_access_token(user_uid=str(user.uid), value=access_payload)
        if refresh_payload:
            await store_refresh_token(user_uid=str(user.uid), value=refresh_payload)
    except REDIS_UNAVAILABLE_ERRORS as exc:
        if not settings.REDIS_FAIL_OPEN:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Sign-in is temporarily unavailable. Please try again shortly.",
            )
        logger.warning("Redis unavailable while issuing tokens: %s", exc)

    return access_token, refresh_token


def _password_fingerprint(user: User) -> str:
    # Changes whenever the password changes, so a reset link works once.
    return hashlib.sha256((user.password or "").encode()).hexdigest()[:16]


def _verification_link(email: str) -> str:
    token = create_url_safe_token({"email": normalize_email(email), "purpose": VERIFY_PURPOSE})
    return token


def _decode_verification_token(token: str):
    data = decode_url_safe_token(
        token,
        max_age=settings.EMAIL_VERIFICATION_MAX_AGE_HOURS * 3600,
    )
    if not data or data.get("purpose", VERIFY_PURPOSE) != VERIFY_PURPOSE:
        return None
    return data


async def _user_from_reset_token(token: str, session: AsyncSession):
    data = decode_url_safe_token(
        token,
        max_age=settings.PASSWORD_RESET_MAX_AGE_MINUTES * 60,
    )
    if not data or data.get("purpose") != RESET_PURPOSE:
        return None
    user = await auth_service.get_user(email=data.get("email", ""), session=session)
    if user is None or not hmac.compare_digest(str(data.get("fp", "")), _password_fingerprint(user)):
        return None
    return user


async def _revoke_sessions(user_uid):
    try:
        await del_access_token(user_uid=str(user_uid))
        await del_refresh_token(user_uid=str(user_uid))
    except REDIS_UNAVAILABLE_ERRORS as exc:
        logger.warning("Could not revoke sessions (Redis unavailable): %s", exc)


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/current_user")
async def get_user(
    user: UserDataModel = Depends(get_this_user),
):
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


# ============================================================
# REFRESH ACCESS TOKEN
# ============================================================

@router.post("/refresh_access")
async def refresh_access_token(
    request: Request,
    response: Response,
    token_details: dict = Depends(RefreshTokenBearer()),
    session: AsyncSession = Depends(session),
):
    user_uid = token_details.get("user", {}).get("uid")
    user_email = token_details.get("user", {}).get("email")

    if not user_uid or not user_email:
        raise InvalidToken()

    user = await auth_service.get_uid_user(
        uid=user_uid,
        session=session,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    new_access_token, _ = await _issue_tokens(user, with_refresh=False)

    if not new_access_token:
        raise InvalidToken()

    response = JSONResponse(
        content={
            "email": str(user.email),
            "user_uid": str(user.uid),
        },
        status_code=status.HTTP_200_OK,
    )

    _set_auth_cookies(response, access_token=new_access_token)

    return response


# ============================================================
# SIGN UP
# ============================================================

@router.post("/sign_up")
async def create_account(
    bg_tasks: BackgroundTasks,
    request: Request,
    account_details: SignUpModel,
    session: AsyncSession = Depends(session),
):
    await rate_limit(request, "sign_up", limit=30, window_seconds=3600)

    if not account_details.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must accept the Terms of Service and Privacy Policy.",
        )

    user_data = account_details.model_dump()
    user_data["email"] = normalize_email(user_data["email"])
    user_data["fullname"] = user_data["fullname"].strip()
    user_data["phone"] = user_data["phone"].strip()

    if await auth_service.get_user_by_phone(user_data["phone"], session):
        raise HTTPException(
            detail="An account with this phone number already exists.",
            status_code=status.HTTP_409_CONFLICT,
        )

    create_user = await auth_service.create_user(
        user_data,
        session,
    )

    if create_user is None:
        raise HTTPException(
            detail="User already exists",
            status_code=status.HTTP_409_CONFLICT,
        )

    user_email = create_user.email
    username = create_user.fullname

    verification_link = str(
        request.url_for(
            "email_verification",
            token=_verification_link(user_email),
        )
    )

    bg_tasks.add_task(
        send_email_verification_email,
        users_email=user_email,
        username=username,
        verification_link=verification_link,
    )

    return JSONResponse(
        content={
            "message": "An Email has been sent for verification of account".title()
        },
        status_code=status.HTTP_201_CREATED,
    )


# ============================================================
# SIGN IN
# ============================================================

@router.post("/sign_in")
async def log_in(
    request: Request,
    login_data: LoginModel,
    session: AsyncSession = Depends(session),
):
    email = login_data.email
    password = login_data.password

    # 10 attempts per 10 minutes per account per IP (CGNAT-friendly)
    await rate_limit(request, "sign_in", limit=10, window_seconds=600, identity=email)

    user = await auth_service.get_user(
        email,
        session,
    )

    if user is None:
        raise HTTPException(
            detail="User not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    if not user.password:
        raise HTTPException(
            detail="This account uses Google sign-in. Continue with Google, or reset your password to set one.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    if not verify_hash(password, user.password):
        raise HTTPException(
            detail="Wrong password or email: try again",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    if not (user.account_verified or user.verified):
        raise HTTPException(
            detail="Please verify your email address before signing in. Check your inbox for the verification link.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    if (user.status or "active").lower() != "active":
        raise HTTPException(
            detail="This account has been suspended. Contact Shipora support.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    access_token, refresh_token = await _issue_tokens(user)

    max_age = 60 * 60 * 24 * 30

    response = JSONResponse(
        content={
            "email": str(user.email),
            "user_uid": str(user.uid),
        },
        status_code=status.HTTP_200_OK,
    )

    _set_auth_cookies(
        response,
        access_token=access_token,
        refresh_token=refresh_token,
        refresh_max_age=max_age,
    )

    return response


# ============================================================
# LOGOUT
# ============================================================

@router.post("/logout")
async def log_out(request: Request):
    """
    Clears the httpOnly auth cookies (the browser can't do that itself) and
    revokes the tokens stored in Redis. Works even if the session already
    expired.
    """
    uid = None
    for name in ("access_token", "refresh_token"):
        token = request.cookies.get(name)
        if not token:
            continue
        try:
            token_data = await asyncio.to_thread(decode_token, token)
        except HTTPException:
            token_data = None
        uid = ((token_data or {}).get("user") or {}).get("uid")
        if uid:
            break

    if uid:
        await _revoke_sessions(uid)

    access = request.cookies.get("access_token")
    if access:
        try:
            await add_jti_to_blocklist(access)
        except REDIS_UNAVAILABLE_ERRORS:
            pass

    response = JSONResponse(content={"message": "Signed out."})
    _clear_auth_cookies(response)
    return response


# ============================================================
# ADMIN LOGIN
# ============================================================

@router.post("/admin-login")
async def admin_login(
    request: Request,
    login_data: LoginModel,
    response: Response,
    session: AsyncSession = Depends(session),
):
    email = str(login_data.email).strip().lower()
    password = login_data.password

    await rate_limit(request, "admin_login", limit=10, window_seconds=900)

    # Admin credentials stay on the backend in .env.
    email_ok = hmac.compare_digest(email, str(settings.ADMIN_EMAIL).strip().lower())
    password_ok = hmac.compare_digest(
        password.encode("utf-8"), str(settings.ADMIN_PASSWORD).encode("utf-8")
    )
    if not (email_ok and password_ok):
        raise HTTPException(
            detail="Invalid admin credentials.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    # The admin must also exist as an admin user in the database because
    # the existing RoleChecker verifies the authenticated DB user's role.
    statement = select(User).where(func.lower(User.email) == email)
    user = (await session.execute(statement)).scalars().first()

    if user is None:
        user = User(
            email=email,
            phone=None,
            fullname="Shipora Administrator",
            password=hash_password(password),
            role=UserRole.ADMIN,
            account_verified=True,
            verified=True,
            status="active",
            terms_accepted=True,
            terms_version="admin",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    else:
        if user.role != UserRole.ADMIN:
            raise HTTPException(
                detail="This account is not an admin account.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        changed = False

        if not user.verified:
            user.verified = True
            changed = True

        if not user.account_verified:
            user.account_verified = True
            changed = True

        if not user.password or not verify_hash(password, user.password):
            user.password = hash_password(password)
            changed = True

        if changed:
            await session.commit()
            await session.refresh(user)

    access_token, refresh_token = await _issue_tokens(user)

    if not access_token:
        raise InvalidToken()

    _set_auth_cookies(
        response,
        access_token=access_token,
        refresh_token=refresh_token,
        refresh_max_age=60 * 60 * 12,
    )

    return {
        "message": "Admin login successful.",
        "admin": True,
    }


# ============================================================
# GOOGLE LOGIN
# ============================================================

def _google_callback_url(request: Request) -> str:
    # Must match an "Authorized redirect URI" in Google Cloud Console.
    if settings.GOOGLE_REDIRECT_URI:
        return settings.GOOGLE_REDIRECT_URI
    return str(request.url_for("auth_google"))


@router.get("/login/google")
async def login_with_google(
    request: Request,
    remember_me: bool = False,
):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=google_unavailable")

    request.session["remember_me"] = remember_me

    return await oauth.google.authorize_redirect(
        request,
        _google_callback_url(request),
    )


@router.get("/google", name="auth_google")
async def auth_google(
    request: Request,
    session: AsyncSession = Depends(session),
):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as exc:
        logger.warning("Google sign-in failed: %s", exc)
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=google")

    user_info = token.get("userinfo") or {}

    email = normalize_email(user_info.get("email"))
    name = user_info.get("name") or email.split("@")[0]

    if not email or user_info.get("email_verified") is False:
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=google")

    remember_me = request.session.pop(
        "remember_me",
        False,
    )

    added_user = await auth_service.get_user(
        email=email,
        session=session,
    )

    if added_user is None:
        await auth_service.create_user(
            user_data={
                "fullname": name,
                "email": email,
                "password": None,
                "phone": None,
                "verified": True,
                "account_verified": True,
                "terms_accepted": True,
                "terms_version": "google",
            },
            session=session,
        )
        added_user = await auth_service.get_user(email=email, session=session)
    elif not added_user.account_verified:
        # Google has verified this email address for us
        added_user.account_verified = True
        await session.commit()

    access_token, refresh_token = await _issue_tokens(added_user)

    response = RedirectResponse(
        url=f"{settings.frontend_url}/home"
    )

    max_age = (
        60 * 60 * 24 * 30
        if remember_me
        else 60 * 60 * 24
    )

    _set_auth_cookies(
        response,
        access_token=access_token,
        refresh_token=refresh_token,
        refresh_max_age=max_age,
    )

    return response


# ============================================================
# OUTLOOK LOGIN
# ============================================================

@router.get("/login/outlook")
async def login_with_outlook():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Outlook sign-in is not available yet.",
    )


# ============================================================
# EMAIL VERIFICATION
# ============================================================

@router.get(
    "/verify/{token}",
    name="email_verification",
)
async def verify_account(
    request: Request,
    token: str,
    session: AsyncSession = Depends(session),
):
    token_data = await asyncio.to_thread(
        _decode_verification_token,
        token,
    )

    if token_data is None:
        # Expired / tampered link: send the user to the app with a hint
        return RedirectResponse(url=f"{settings.frontend_url}/login?verification=expired")

    email = token_data["email"]

    user = await auth_service.get_user(
        email=email,
        session=session,
    )

    if user is None:
        raise UserNotFound()

    if not user.account_verified:
        await auth_service.update_user_info(
            user=user,
            info={
                "account_verified": True
            },
            session=session,
        )

    login_link = f"{settings.frontend_url}/login"

    return template.TemplateResponse(
        request=request,
        name="email_verified.html",
        context={
            "request": request,
            "home_link": login_link,
        },
        status_code=200,
    )


# ============================================================
# RESEND VERIFICATION
# ============================================================

async def _queue_verification_email(request: Request, bg: BackgroundTasks, email: str, session: AsyncSession):
    await rate_limit(request, "resend_verification", limit=5, window_seconds=900, identity=email)

    user = await auth_service.get_user(email=email, session=session)

    # Same response whether or not the account exists (no account probing)
    if user is not None and not (user.account_verified or user.verified):
        verification_link = str(
            request.url_for(
                "email_verification",
                token=_verification_link(user.email),
            )
        )
        bg.add_task(
            send_email_verification_email,
            users_email=user.email,
            username=user.fullname,
            verification_link=verification_link,
        )

    return JSONResponse(
        content={
            "message": "An Email has been sent for verification of account".title()
        },
        status_code=status.HTTP_201_CREATED,
    )


@router.post("/resend_verification")
async def resend_verification(
    bg: BackgroundTasks,
    request: Request,
    data: EmailRequest,
    session: AsyncSession = Depends(session),
):
    return await _queue_verification_email(request, bg, data.email, session)


@router.get(
    "/resend_verification/{email}/{username}"
)
async def resend_verify(
    bg: BackgroundTasks,
    request: Request,
    email: str,
    username: str,
    session: AsyncSession = Depends(session),
):
    # Kept for backwards compatibility. The name in the email now always
    # comes from the account, never from the URL.
    return await _queue_verification_email(request, bg, email, session)


# ============================================================
# RESET PASSWORD REQUEST
# ============================================================

@router.post("/reset_password/{email}")
async def reset_user_password(
    request: Request,
    bg: BackgroundTasks,
    email: str,
    session: AsyncSession = Depends(session),
):
    email = normalize_email(email)

    await rate_limit(request, "reset_password", limit=5, window_seconds=900, identity=email)

    user = await auth_service.get_user(
        email=email,
        session=session,
    )

    if user is not None:
        safe_token = create_url_safe_token(
            {
                "email": user.email,
                "purpose": RESET_PURPOSE,
                "fp": _password_fingerprint(user),
            }
        )

        # The link opens the app's Reset Password page
        reset_link = f"{settings.frontend_url}/reset-password?token={safe_token}"

        bg.add_task(
            send_password_reset_email,
            users_email=user.email,
            username=user.fullname,
            verification_link=reset_link,
        )

    # Same answer either way so the endpoint can't be used to find accounts
    return JSONResponse(
        content={
            "message": f"If an account exists for {email}, a reset email has been sent."
        }
    )


# ============================================================
# PASSWORD RESET FORM (server-rendered fallback)
# ============================================================

@router.get(
    "/password_reset/{token}",
    name="reset_link",
)
async def password_reset_form(
    request: Request,
    token: str,
    session: AsyncSession = Depends(session),
):
    user = await _user_from_reset_token(token, session)

    if user is None:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "This reset link is invalid or has expired."
            },
        )

    home_link = f"{settings.frontend_url}/login"

    form_link = f"{request.url_for('verify_reset_link')}?token={token}"

    return template.TemplateResponse(
        request=request,
        name="reset_password_form.html",
        context={
            "request": request,
            "token": token,
            "home_link": home_link,
            "form_link": form_link,
        },
    )


# ============================================================
# VERIFY PASSWORD RESET
# ============================================================

async def _apply_password_reset(token: str, new_password: str, confirm_password: str, session: AsyncSession):
    user = await _user_from_reset_token(token, session)

    if user is None:
        raise HTTPException(
            status_code=403,
            detail="This reset link is invalid or has expired. Request a new one.",
        )

    if new_password != confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match",
        )

    if len(new_password or "") < 8:
        raise HTTPException(
            status_code=400,
            detail="Your new password must be at least 8 characters.",
        )

    await auth_service.update_user_info(
        user=user,
        info={
            "password": hash_password(new_password),
            # the reset email proves ownership of the address
            "account_verified": True,
        },
        session=session,
    )

    # Sign out every existing session for this account
    await _revoke_sessions(user.uid)

    return user


@router.post(
    "/password_reset",
    name="verify_reset_link",
)
async def verify_password_reset(
    request: Request,
    token: str,
    session: AsyncSession = Depends(session),
    new_password=Form(...),
    confirm_password: str = Form(...),
):
    await _apply_password_reset(token, new_password, confirm_password, session)

    home_link = f"{settings.frontend_url}/login"

    return template.TemplateResponse(
        request=request,
        name="reset_verified.html",
        context={
            "request": request,
            "home_link": home_link,
        },
    )


@router.post("/password_reset/confirm")
async def confirm_password_reset(
    request: Request,
    data: PasswordResetConfirm,
    session: AsyncSession = Depends(session),
):
    """JSON version used by the frontend Reset Password page."""
    await rate_limit(request, "password_reset", limit=10, window_seconds=900)
    await _apply_password_reset(data.token, data.new_password, data.confirm_password, session)
    return {"message": "Your password has been updated. You can now sign in."}


# ============================================================
# DELETE ACCOUNT
# ============================================================

@router.delete("/delete_account")
async def delete_account_():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Account deletion is handled by Shipora support. Please contact us.",
    )
