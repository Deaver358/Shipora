from fastapi import FastAPI, Request, status
from typing import Callable, Any
from fastapi.responses import JSONResponse
import logging

logging.basicConfig(
    level=logging.ERROR,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.FileHandler("errors.log")],
)

logger = logging.getLogger(__name__)


class HousifyException(Exception):
    """Exception for strexpei"""


class InvalidToken(HousifyException):
    """Invalid token was provided"""


class TokenInBlocklist(HousifyException):
    """Token is in blocklist"""


class ExpiredToken(HousifyException):
    """Expired token was provided"""


class RevokedToken(HousifyException):
    """Revoked token was provided"""


class AccessTokenRequired(HousifyException):
    """Access token is required"""


class RefreshTokenRequired(HousifyException):
    """Refresh token is required"""


class RefreshTokenExpired(HousifyException):
    """Refresh token has expired or has been revoked"""


class UserAlreadyExists(HousifyException):
    """Provided email belongs to an existing user"""


class UserNotFound(HousifyException):
    """user not found"""


class AccountNotVerified(HousifyException):
    """account not verified"""


class InvalidCredentials(HousifyException):
    """User has provided an invalid password"""


class InsufficientPermission(HousifyException):
    """User does not have required permissions to perform this action"""


class InvalidAuthorizationCredentials(HousifyException):
    """User must have provided an invalid token"""


class InvalidOtpCode(HousifyException):
    """User provided an invalid OTP code"""


class WrongOtp(HousifyException):
    """User provided an invalid OTP code"""


class MaxOtpAttempts(HousifyException):
    """User provided an invalid OTP code"""

class AccountNotVerified(HousifyException):
    """user has not verified their account"""


def create_exception_handler(
    status_code: int, initial_detail: Any
) -> Callable[[Request, Exception], JSONResponse]:

    async def exception_handler(request: Request, exc: HousifyException):

        return JSONResponse(content=initial_detail, status_code=status_code)

    return exception_handler


def register_all_errors(app: FastAPI):

    app.add_exception_handler(
        InvalidToken,
        create_exception_handler(
            status_code=status.HTTP_400_BAD_REQUEST,
            initial_detail={
                "message": "invalid token provided",
                "error_code": "invalid_token_provided",
            },
        ),
    )

    app.add_exception_handler(
        ExpiredToken,
        create_exception_handler(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            initial_detail={
                "message": "token is expired",
                "error_code": "token_is_expired",
            },
        ),
    )

    app.add_exception_handler(
        RevokedToken,
        create_exception_handler(
            status_code=status.HTTP_410_GONE,
            initial_detail={
                "message": "token is rovoked",
                "error_code": "revoked_token_provided",
            },
        ),
    )

    app.add_exception_handler(
        TokenInBlocklist,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message": "token is blocked",
                "error_code": "token_in_blocklist",
            }
        )
    )

    app.add_exception_handler(
        AccessTokenRequired,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message": "access token is required",
                "error_code": "access_token_required",
            },
        ),
    )

    app.add_exception_handler(
        RefreshTokenRequired,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message": "refresh token is required",
                "error_code": "refresh_token_required",
            },
        ),
    )

    app.add_exception_handler(
        RefreshTokenExpired,
        create_exception_handler(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            initial_detail={
                "message": "refresh token is expired",
                "error_code": "refresh_token_expired",
            },
        ),
    )

    app.add_exception_handler(
        UserAlreadyExists,
        create_exception_handler(
            status_code=status.HTTP_409_CONFLICT,
            initial_detail={
                "message": "user with email exists",
                "error_code": "user_with_email_exists",
            },
        ),
    )

    app.add_exception_handler(
        UserNotFound,
        create_exception_handler(
            status_code=status.HTTP_404_NOT_FOUND,
            initial_detail={
                "message": "user not found",
                "error_code": "user_not_found",
            },
        ),
    )

    app.add_exception_handler(
        AccountNotVerified,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message": "user needs to verify account",
                "error_code": "account_not_verified",
            },
        ),
    )

    app.add_exception_handler(
        InvalidCredentials,
        create_exception_handler(
            status_code=status.HTTP_404_NOT_FOUND,
            initial_detail={
                "message": "invalid credentials, user not found",
                "error_code": "invalid_credentials_provided",
            },
        ),
    )

    app.add_exception_handler(
        InsufficientPermission,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message": "user does not have the required permission for this action",
                "error_code": "insufficient_permission",
            },
        ),
    )

    app.add_exception_handler(
        InvalidAuthorizationCredentials,
        create_exception_handler(
            status_code=status.HTTP_404_NOT_FOUND,
            initial_detail={
                "message": "invalid auth credentials",
                "error_code": "invalid_auth_credentials",
            },
        ),
    )

    app.add_exception_handler(
        InvalidOtpCode,
        create_exception_handler(
            status_code=status.HTTP_404_NOT_FOUND,
            initial_detail={"message": "invalid otp", "error_code": "invalid_otp"},
        ),
    )

    app.add_exception_handler(
        WrongOtp,
        create_exception_handler(
            status_code=status.HTTP_404_NOT_FOUND,
            initial_detail={
                "message": "code doesn't match otp",
                "error_code": "unmatched_otp",
            },
        ),
    )

    app.add_exception_handler(
        MaxOtpAttempts,
        create_exception_handler(
            status_code=status.HTTP_403_FORBIDDEN,
            initial_detail={
                "message": "max attempts reached",
                "error_code": "max_attempt_reached",
            },
        ),
    )

    app.add_exception_handler(
        AccountNotVerified,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message":"You need to verify your acccount",
                "error_code":"account_not_verified"
            }
        )
    )

    @app.exception_handler(500)
    async def internal_server_error(request, exc):
        return JSONResponse(
            content={
                "message": "Oops! Something went wrong!!!",
                "error_code": "internal_server_error",
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
