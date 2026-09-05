from fastapi import APIRouter, Depends, Request, Response, BackgroundTasks, status, Form
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.session_config import session
from app.core.dependencies import AccessTokenBearer, RefreshTokenBearer, get_this_user
from app.schema.auth_schema import SignUpModel, LoginModel
from app.schema.user import UserDataModel
from app.services.auth_services import AuthService
from app.utils.validators import create_url_safe_token, create_access_token, create_refresh_token
from app.utils.mail import send_email_verification_email
from app.utils.hash_password import verify_hash
from app.utils.path import template_path
from fastapi.templating import Jinja2Templates
from app.utils.redis import store_access_token, store_refresh_token

router = APIRouter()
auth_service = AuthService()
REFRESH_TOKEN_EXPIRY = 604800


template = Jinja2Templates(template_path)


@router.get("/current_user")
async def get_user(user: UserDataModel = Depends(get_this_user)):
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="user no dey"
        )
    return user


@router.post("/refresh_access")
async def refresh_access_token(
    request: Request,
    response: Response,
    token_details: dict = Depends(RefreshTokenBearer()),
    session: AsyncSession = Depends(session),
):

    user_uid = token_details.get("user").get("uid")
    user_email = token_details.get("user").get("email")

    user = await auth_service.get_user(email=user_email, session=session)
    if not user:
        raise UserNotFound()

    user_data = {"email": user.email, "uid": str(user.uid)}
    new_access_token, access_payload = create_access_token(user_data=user_data)
    if not new_access_token:
        raise InvalidToken()

    await store_access_token(user_uid=user_uid, value=access_payload)

    response = JSONResponse(
        content={
            "email": user_email,
            "user_uid": str(user_uid),
        },
        status_code=status.HTTP_200_OK,
    )
    response.set_cookie(
        key=f"access_token",
        value=new_access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )
    
    return response

@router.get("/sign_up")
async def create_account(bg_tasks: BackgroundTasks, request: Request, account_details: SignUpModel, session: AsyncSession = Depends(session)):
    user_data = account_details.model_dump()
    create_user = await auth_service.create_user(user_data, session)

    user_email = create_user.email
    token_data = {'email': user_email}
    username = create_user.fullname
    token = create_url_safe_token(token_data)
    verification_link = str(request.url_for("email_verification", token=token))

    bg_tasks.add(
        send_email_verification_email,
        users_email=user_email,
        username=username,
        verification_link=verification_link
    )

    return JSONResponse(
        content={
            "message": "An Email has been sent for verification of account".title()
        },
        status_code=status.HTTP_201_CREATED,
    )


@router.post("/sign_in/{remember_me}")
async def log_in(remember_me: bool, login_data: LoginModel, session: AsyncSession = Depends(session)):
    email = login_data.email
    password = login_data.password

    user = await auth_service.get_user(email, session)
    if user is None:
        raise HTTPException(
            detail="User not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    if not verify_hash(password, user.password):
        raise HTTPException(
            detail="Wrong password or email: try again",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    user_data = {
        'email': str(user.email),
        'uid': str(user.uid),
    }

    access_token, apayload = create_access_token(user_data=user_data)
    refresh_token, jti, rpayload = create_refresh_token(
        user_data=user_data, expiry=REFRESH_TOKEN_EXPIRY, refresh=True
    )
    await store_access_token(user_uid=jti, value=apayload)
    await store_refresh_token(user_uid=jti, value=rpayload)

    max_age = 60 * 60 * 24 * 30 if remember_me else 60 * 60 * 24

    response = JSONResponse(
        content={
            "email": email,
            "user_uid": str(user.uid)
        },
        status_code=status.HTTP_200_OK,
    )
    response.set_cookie(
        key=f"refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        domain="localhost",
        max_age=max_age,
    )
    response.set_cookie(
        key=f"access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )
    return response
    

@router.get("/login/google")
async def login_with_google(request: Request, remember_me: bool = False):
    request.session["remember_me"] = remember_me
    redirect_url = request.url_for(
        "auth_google"
    )  # Acts as a callback url for google to redirect to after successful authentication
    # Also url_for is used to generate the absolute url for the auth_google endpoint which is required by google for redirection after authentication
    return await oauth.google.authorize_redirect(request, redirect_url)


@router.get("/google", name="auth_google")
async def auth_google(
    request: Request,
    session: AsyncSession = Depends(session),
):

    token = await oauth.google.authorize_access_token(request)
    user_info = token["userinfo"]

    email = user_info["email"]
    name = user_info["name"]
    remember_me = request.session.get("remember_me", False)

    # gets user by email
    added_user = await auth_service.get_user(email=email, session=session)

    if added_user is None:
        """if user doesnt exists user is added to the database"""
        added_user = await auth_service.create_user(
            signup_data={"fullname": name, "email": email, "password": None, "verified": True},
            session=session,
        )

    user_data = {
        "email": added_user.email,
        "uid": str(added_user.uid),
    }

    access_token, access_payload = create_access_token(user_data=user_data)
    
    refresh_token, jti, payload = create_refresh_token(
        user_data=user_data, expiry=REFRESH_TOKEN_EXPIRY, refresh=True
    )
    await store_refresh_token(user_uid=jti, value=payload)
    await store_access_token(user_uid=jti, value=access_payload)

    response = RedirectResponse(
        url="http://localhost:5173/dashboard"
    )

    max_age = 60 * 60 * 24 * 30 if remember_me else 60 * 60 * 24
    response.set_cookie(
        key=f"refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        domain="localhost",
        max_age=max_age,
    )

    response.set_cookie(
        key=f"access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )
    return response


@router.get("/login/outlook")
async def login_with_outlook():
    pass


@router.get("/verify/{token}", name="email_verification")
async def verify_account(
    request: Request, token: str, session: AsyncSession = Depends(session)
):
    token_data = await asyncio.to_thread(decode_url_safeToken, token=token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Token is Invalid"},
        )
    email = token_data["email"]
    user = await auth_service.get_email_user(email=email, session=session)
    
    if not user:
        raise UserNotFound()
    
    await auth_service.update_user_info(
        user=user, info={"is_verified": True}, session=session
    )
    login_link = str("http://localhost:5173/sign-in") #link for sign in page
    return template.TemplateResponse(
        request=request,
        name="email_verified.html",
        context={"request": request, "home_link": login_link},
        status_code=200,
    )


@router.get("/resend_verification/{email}/{username}")
async def resend_verify(
    bg: BackgroundTasks,
    request: Request,
    email: str,
    username: str,
    session: AsyncSession = Depends(session),
):
    users_email = email
    token_data = {"email": users_email}
    token = create_url_safe_token(data=token_data)
    verification_link = str(request.url_for("email_verification", token=token))

    bg.add_task(
        send_email_verification_email,
        users_email=users_email,
        username=username,
        verification_link=verification_link,
    )

    return JSONResponse(
        content={
            "message": "An Email has been sent for verification of account".title()
        },
        status_code=status.HTTP_201_CREATED,
    )


@router.post("/reset_password")
async def reset_user_password(
    request: Request,
    bg: BackgroundTasks,
    email: str,
    session: AsyncSession = Depends(session),
):
    user = await auth_service.get_email_user(email=email, session=session)
    if user is None:
        raise HTTPException(
            status_code=404, detail="User not found try signing up"
        )
    token_data = {"email": email}
    username = user.fullname
    safe_token = create_url_safe_token(token_data)
    reset_link = str(request.url_for("reset_link", token=safe_token))
    bg.add_task(
        send_password_reset_email,
        users_email=email,
        username=username,
        verification_link=reset_link,
    )
    return JSONResponse(content={"message": f"Reset email has been sent to {email}"})


@router.get("/password_reset/{token}", name="reset_link")
async def password_reset_form(
    request: Request, token: str, session: AsyncSession = Depends(session)
):
    token_data = await asyncio.to_thread(decode_url_safeToken, token=token)
    if token_data is None:
        raise HTTPException(status_code=403, detail={"message": "Invalid Token"})

    email = token_data["email"]
    user = await auth_service.get_email_user(email=email, session=session)

    if user is None:
        raise UserNotFound()

    home_link = str(request.url_for("swagger_ui_html"))
    form_link = f"http://127.0.0.1:8000/api/v1.0/auth/password_reset?token={token}"  # Reason i did this is because url_for() was giving me a no routes found with name error so i just hardcoded it
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

@router.post("/password_reset", name="verify_reset_link")
async def verify_password_reset(
    request: Request,
    token: str,
    session: AsyncSession = Depends(session),
    new_password=Form(...),
    confirm_password: str = Form(...),
):
    token_data = await asyncio.to_thread(decode_url_safeToken, token=token)
    if token_data is None:
        raise HTTPException(status_code=403, detail={"message": "Invalid Token"})
    email = token_data["email"]

    user = await auth_service.get_email_user(email=email, session=session)
    new_password_hash = hash_password(new_password)

    await auth_service.update_user_info(
        user=user, info={"hashed_password": new_password_hash}, session=session
    )
    home_link = str("http://localhost:5173/sign-in")

    return template.TemplateResponse(
        request=request,
        name="reset_verified.html",
        context={"request": request, "home_link": home_link},
    )

@router.delete("/delete_account")
async def delete_account_():
    pass