# ===========================================
# WARIZMY EDUCATION - FastAPI Hauptanwendung
# ===========================================
# Einstiegspunkt für die Backend-API
# Konfiguriert CORS, Router und Lifecycle-Events

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Core: Konfiguration
from app.core.config import get_settings

# DB: Datenbankverbindung
from app.db.session import init_db, close_db

# API: Router importieren (neu strukturiert)
from app.api.v1 import api_router

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
    "http://localhost:3002",           # Next.js Dev (Docker)
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
# API Router einbinden (vereinfacht!)
# =========================================
# Alle API-Endpunkte unter /api
app.include_router(api_router, prefix="/api")


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
        "endpoints": {
            "courses": "/api/courses",
            "content": "/api/content",
            "auth": "/api/auth",
            "users": "/api/users",
        }
    }
