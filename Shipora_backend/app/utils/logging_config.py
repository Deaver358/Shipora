import logging
import sys

from .config import settings


def setup_logging() -> None:
    level = getattr(logging, str(settings.LOG_LEVEL).upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        stream=sys.stdout,
        force=True,
    )
    # SQLAlchemy echo is controlled by DB_ECHO; keep its logger quiet otherwise.
    if not settings.DB_ECHO:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("apscheduler").setLevel(logging.WARNING)
