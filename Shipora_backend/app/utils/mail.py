from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig
from .config import settings
from typing import List
from .helpers import get_html_email, EmailTypes
from .path import template_path
import asyncio
import logging

logger = logging.getLogger("shipora.mail")

config = ConnectionConfig(
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    # Port 465 is implicit TLS; 587/25 use STARTTLS.
    MAIL_SSL_TLS=settings.MAIL_PORT == 465,
    MAIL_STARTTLS=settings.MAIL_PORT != 465,
    TEMPLATE_FOLDER=template_path,
    VALIDATE_CERTS=settings.MAIL_VALIDATE_CERTS,
    SUPPRESS_SEND=1 if settings.MAIL_SUPPRESS_SEND else 0,
)

mail = FastMail(config=config)

async def create_message(recipients: List[str], subject: str, body: str):
    message = MessageSchema(
        recipients=recipients, subject=subject, body=body, subtype=MessageType.html
    )
    return message


async def _send(message: MessageSchema, attempts: int = 3):
    """Send with a couple of retries; never raise into a background task."""
    for attempt in range(1, attempts + 1):
        try:
            await mail.send_message(message=message)
            return True
        except Exception as exc:  # SMTP outages must not crash requests
            logger.warning("Email send attempt %s/%s failed: %s", attempt, attempts, exc)
            if attempt < attempts:
                await asyncio.sleep(2 * attempt)
    logger.error("Giving up sending email '%s' to %s", message.subject, message.recipients)
    return False


async def send_email_verification_email(users_email: str, username: str, verification_link: str):
    email_verification_subject = "Verify Your Email"
    email_verification_html = await asyncio.to_thread(
        get_html_email,
        email_types=EmailTypes.email,
        username=username,
        verification_link=verification_link,
    )
    message = await create_message(
        recipients=[users_email],
        subject=email_verification_subject,
        body=email_verification_html,
    )
    await _send(message)

async def send_password_reset_email(
    users_email: str, username: str, verification_link: str
):
    password_reset_subject = "Reset Your Shipora Password"
    password_reset_html = await asyncio.to_thread(
        get_html_email,
        email_types=EmailTypes.password,
        username=username,
        verification_link=verification_link,
    )
    message = await create_message(
        recipients=[users_email],
        subject=password_reset_subject,
        body=password_reset_html,
    )
    await _send(message)
