# ===========================================
# WARIZMY EDUCATION - FastAPI Hauptanwendung
# ===========================================
# Einstiegspunkt für die Backend-API
# Konfiguriert CORS, Router und Lifecycle-Events

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import init_db, close_db

# Router importieren
from app.routers import auth, users, classes, enrollments, sessions, payments, exams, certificates, admin

# Settings laden
settings = get_settings()


# =========================================
# Lifecycle Manager (Startup/Shutdown)
# =========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Anwendungs-Lifecycle verwalten.
    - Startup: Datenbank initialisieren
    - Shutdown: Verbindungen schließen
    """
    # === STARTUP ===
    print("🚀 WARIZMY Education Backend startet...")
    
    # Datenbank initialisieren
    await init_db()
    print("✅ Datenbankverbindung hergestellt")
    
    yield  # Anwendung läuft
    
    # === SHUTDOWN ===
    print("🛑 WARIZMY Education Backend wird heruntergefahren...")
    
    # Datenbankverbindung schließen
    await close_db()
    print("✅ Datenbankverbindung geschlossen")


# =========================================
# FastAPI App erstellen
# =========================================
app = FastAPI(
    title=settings.APP_NAME,
    description="API für die WARIZMY Education Lernplattform",
    version=settings.APP_VERSION,
    # API-Dokumentation unter /docs (Swagger) und /redoc
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    # OpenAPI Schema
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
    # Lifecycle-Manager
    lifespan=lifespan,
)


# =========================================
# CORS Middleware
# =========================================
# Erlaubte Origins (Frontends, die auf die API zugreifen dürfen)
allowed_origins = [
    "http://localhost:3000",           # Next.js Dev
    "https://ac.warizmy.com",          # Produktion
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,            # Cookies erlauben
    allow_methods=["*"],               # Alle HTTP-Methoden
    allow_headers=["*"],               # Alle Header
)


# =========================================
# API Router einbinden
# =========================================
# Präfix /api für alle Routen
api_prefix = "/api"

# Authentifizierung
app.include_router(
    auth.router, 
    prefix=f"{api_prefix}/auth", 
    tags=["Authentifizierung"]
)

# Benutzer
app.include_router(
    users.router, 
    prefix=f"{api_prefix}/users", 
    tags=["Benutzer"]
)

# Klassen
app.include_router(
    classes.router, 
    prefix=f"{api_prefix}/classes", 
    tags=["Klassen"]
)

# Einschreibungen & Fortschritt
app.include_router(
    enrollments.router, 
    prefix=f"{api_prefix}/enrollments", 
    tags=["Einschreibungen"]
)

# Live-Sessions & Anwesenheit
app.include_router(
    sessions.router, 
    prefix=f"{api_prefix}/sessions", 
    tags=["Sessions"]
)

# Zahlungen
app.include_router(
    payments.router, 
    prefix=f"{api_prefix}/payments", 
    tags=["Zahlungen"]
)

# Prüfungen
app.include_router(
    exams.router, 
    prefix=f"{api_prefix}/exams", 
    tags=["Prüfungen"]
)

# Zertifikate
app.include_router(
    certificates.router, 
    prefix=f"{api_prefix}/certificates", 
    tags=["Zertifikate"]
)

# Admin-Bereich
app.include_router(
    admin.router, 
    prefix=f"{api_prefix}/admin", 
    tags=["Admin"]
)


# =========================================
# Health Check Endpoint
# =========================================
@app.get("/api/health", tags=["System"])
async def health_check():
    """
    Prüft, ob die API erreichbar ist.
    Wird von Docker/Nginx für Health Checks verwendet.
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }
    )


# =========================================
# Root Endpoint (API Info)
# =========================================
@app.get("/api", tags=["System"])
async def api_info():
    """
    API-Informationen anzeigen.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/api/docs" if settings.DEBUG else "Deaktiviert in Produktion",
        "health": "/api/health",
    }

