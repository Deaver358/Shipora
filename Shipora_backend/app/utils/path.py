from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

v1_path = Path(BASE_DIR,"app")
template_path = Path(v1_path, "templates")
static_files_path = Path(v1_path, "static")
email_verification_path = Path(template_path, "email_verification.html")
password_reset_path = Path(template_path, "password_reset.html")