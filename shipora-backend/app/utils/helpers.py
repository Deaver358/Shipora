from enum import Enum
from .path import email_verification_path, password_reset_path
from .config import settings


class EmailTypes(str, Enum):
    email: str = "email"
    password: str = "password"

def get_html_email(email_types: EmailTypes, username: str, verification_link: str):
    path = (
        email_verification_path
        if email_types == EmailTypes.email
        else password_reset_path
    )

    with open(path, "r", encoding="utf-8") as file:
        html_text = file.read()
        html_text = (
            html_text.replace("{{first_name}}", username).replace(
                "{{verification_link}}", verification_link
            )
            if email_types == EmailTypes.email_types
            else html_text.replace("{{first_name}}", username).replace(
                "{{reset_link}}", verification_link
            )
        )

    return html_text