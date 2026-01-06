# ===========================================
# WARIZMY EDUCATION - System Models Package
# ===========================================
# System-bezogene Modelle (Feiertage, E-Mail-Logs)

from app.models.system.holiday import Holiday
from app.models.system.email_log import (
    EmailLog,
    EmailType,
    EmailStatus,
)

__all__ = [
    "Holiday",
    "EmailLog",
    "EmailType",
    "EmailStatus",
]

