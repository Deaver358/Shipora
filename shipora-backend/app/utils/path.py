from pathlib import Path
from .config import BASE_DIR

v1_path = Path(BASE_DIR,"shipora-backend","app")
template_path = Path(v1_path, "templates")
static_files_path = Path(v1_path, "static")
email_verification_path = Path(template_path, "email_verification.html")
password_reset_path = Path(template_path, "password_reset.html")