# ===========================================
# WARIZMY EDUCATION - Datenbankverbindung
# ===========================================
# Asynchrone Datenbankverbindung mit SQLAlchemy 2.0
# Verwendet asyncpg für PostgreSQL

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from typing import AsyncGenerator

from app.core.config import get_settings
from app.db.base import Base
from sqlalchemy import text

# Settings laden
settings = get_settings()

# =========================================
# Async Engine erstellen
# =========================================
# Konvertiere postgresql:// zu postgresql+asyncpg://
database_url = settings.DATABASE_URL.replace(
    "postgresql://", 
    "postgresql+asyncpg://"
)

engine = create_async_engine(
    database_url,
    # Verbindungspool-Einstellungen
    pool_size=5,           # Minimale Verbindungen
    max_overflow=10,       # Maximale zusätzliche Verbindungen
    pool_timeout=30,       # Timeout beim Warten auf Verbindung
    pool_recycle=1800,     # Verbindungen nach 30 Min recyceln
    # Nur in Debug-Modus SQL loggen
    echo=settings.DEBUG,
)

# =========================================
# Session Factory erstellen
# =========================================
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Objekte nach Commit nicht ablaufen lassen
    autocommit=False,
    autoflush=False,
)


# =========================================
# Dependency für FastAPI
# =========================================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency für FastAPI Routen.
    Erstellt eine neue Datenbanksession für jeden Request.
    
    Verwendung:
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # Bei erfolgreicher Ausführung committen
            await session.commit()
        except Exception:
            # Bei Fehler zurückrollen
            await session.rollback()
            raise
        finally:
            # Session immer schließen
            await session.close()


# =========================================
# Initialisierung (für Startup)
# =========================================
async def init_db():
    """
    Datenbank initialisieren.
    Erstellt alle Tabellen basierend auf den Modellen.
    
    HINWEIS: In Produktion Alembic für Migrationen verwenden!
    """
    async with engine.begin() as conn:
        # Alle Tabellen erstellen (nur wenn nicht vorhanden)
        await conn.run_sync(Base.metadata.create_all)

        # -------------------------------------------------------------------
        # Minimal "auto migrations" (idempotent)
        # Since this repo currently doesn't ship Alembic migrations, we apply
        # additive schema changes here so existing Railway DBs get new columns.
        # -------------------------------------------------------------------
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth date"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_channel_opt_in boolean NOT NULL DEFAULT false"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false"))


async def close_db():
    """
    Datenbankverbindung schließen.
    Wird beim Herunterfahren der Anwendung aufgerufen.
    """
    await engine.dispose()

