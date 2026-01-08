# ===========================================
# WARIZMY EDUCATION - API v1 Router
# ===========================================
# Aggregiert alle API v1 Endpoints

from fastapi import APIRouter

# Importiere alle Router aus dem routers-Verzeichnis
# (Legacy-Pfad, wird später zu api/v1/endpoints migriert)
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
    courses,
    content,
    upload,
    locations,
)
import app.routers.homework as homework_router
from app.routers.admin_announcements import router as admin_announcements_router

# Haupt-Router für API v1
api_router = APIRouter()

# =========================================
# Authentifizierung
# =========================================
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentifizierung"]
)

# =========================================
# Benutzer
# =========================================
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Benutzer"]
)

# =========================================
# Klassen
# =========================================
api_router.include_router(
    classes.router,
    prefix="/classes",
    tags=["Klassen"]
)

# =========================================
# Kurse & Lektionen
# =========================================
api_router.include_router(
    courses.router,
    prefix="/courses",
    tags=["Kurse"]
)

# =========================================
# Content: Lehrer, FAQs, Testimonials, etc.
# =========================================
api_router.include_router(
    content.router,
    prefix="/content",
    tags=["Content"]
)

# =========================================
# Datei-Uploads (MinIO)
# =========================================
api_router.include_router(
    upload.router,
    prefix="/upload",
    tags=["Upload"]
)

# =========================================
# Einschreibungen & Fortschritt
# =========================================
api_router.include_router(
    enrollments.router,
    prefix="/enrollments",
    tags=["Einschreibungen"]
)

# =========================================
# Live-Sessions & Anwesenheit
# =========================================
api_router.include_router(
    sessions.router,
    prefix="/sessions",
    tags=["Sessions"]
)

# =========================================
# Zahlungen
# =========================================
api_router.include_router(
    payments.router,
    prefix="/payments",
    tags=["Zahlungen"]
)

# =========================================
# Prüfungen
# =========================================
api_router.include_router(
    exams.router,
    prefix="/exams",
    tags=["Prüfungen"]
)

# =========================================
# Zertifikate
# =========================================
api_router.include_router(
    certificates.router,
    prefix="/certificates",
    tags=["Zertifikate"]
)

# =========================================
# Admin-Bereich
# =========================================
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["Admin"]
)

# =========================================
# Admin Ankündigungen
# =========================================
api_router.include_router(
    admin_announcements_router,
    prefix="/admin",
    tags=["Admin"]
)

# =========================================
# Standorte
# =========================================
api_router.include_router(
    locations.router,
    prefix="/locations",
    tags=["Standorte"]
)

# =========================================
# Hausaufgaben
# =========================================
api_router.include_router(
    homework_router.router,
    prefix="/homework",
    tags=["Hausaufgaben"]
)

