from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig
from app.config import settings
from typing import List
from .helpers import get_html_email, EmailTypes
from .path import template_path
import asyncio

config = ConnectionConfig(
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_SSL_TLS=False,
    MAIL_STARTTLS=True,
    TEMPLATE_FOLDER=template_path,
    VALIDATE_CERTS=False,
)

mail = FastMail(config=config)

async def create_message(recipients: List[str], subject: str, body: str):
    message = MessageSchema(
        recipients=recipients, subject=subject, body=body, subtype=MessageType.html
    )
    return message

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
    await mail.send_message(message=message)