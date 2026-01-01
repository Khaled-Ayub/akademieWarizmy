# ===========================================
# WARIZMY EDUCATION - API Routers Package
# ===========================================
# Alle REST API Router exportieren

from app.routers import (
    auth,
    users,
    classes,
    enrollments,
    sessions,
    payments,
    exams,
    certificates,
    admin,
)

__all__ = [
    "auth",
    "users", 
    "classes",
    "enrollments",
    "sessions",
    "payments",
    "exams",
    "certificates",
    "admin",
]

