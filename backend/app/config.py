# ===========================================
# WARIZMY EDUCATION - Konfiguration
# ===========================================
# Zentrale Konfigurationsdatei für alle Umgebungsvariablen
# Verwendet pydantic-settings für Typsicherheit und Validierung

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Zentrale Anwendungskonfiguration.
    Alle Werte werden aus Umgebungsvariablen geladen.
    """
    
    # =========================================
    # Allgemein
    # =========================================
    APP_NAME: str = "WARIZMY Education"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # =========================================
    # Datenbank
    # =========================================
    DATABASE_URL: str = "postgresql://warizmy:password@localhost:5432/warizmy_app"
    
    # =========================================
    # Redis
    # =========================================
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # =========================================
    # JWT (Authentifizierung)
    # =========================================
    JWT_SECRET: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    # Access Token: 30 Minuten
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Refresh Token: 7 Tage
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # =========================================
    # Strapi CMS
    # =========================================
    STRAPI_URL: str = "http://localhost:1337"
    STRAPI_API_TOKEN: Optional[str] = None
    
    # =========================================
    # MinIO / S3
    # =========================================
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "warizmy"
    MINIO_USE_SSL: bool = False
    
    # =========================================
    # Stripe (Zahlungen)
    # =========================================
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_SUCCESS_URL: str = "https://ac.warizmy.com/zahlung/erfolg"
    STRIPE_CANCEL_URL: str = "https://ac.warizmy.com/zahlung/abgebrochen"
    
    # =========================================
    # PayPal (Zahlungen)
    # =========================================
    PAYPAL_CLIENT_ID: Optional[str] = None
    PAYPAL_CLIENT_SECRET: Optional[str] = None
    PAYPAL_MODE: str = "sandbox"  # 'sandbox' oder 'live'
    
    # =========================================
    # Zoom (Live-Unterricht)
    # =========================================
    ZOOM_ACCOUNT_ID: Optional[str] = None
    ZOOM_CLIENT_ID: Optional[str] = None
    ZOOM_CLIENT_SECRET: Optional[str] = None
    
    # =========================================
    # Vimeo (Video-Hosting)
    # =========================================
    VIMEO_ACCESS_TOKEN: Optional[str] = None
    
    # =========================================
    # E-Mail (SMTP)
    # =========================================
    SMTP_HOST: str = "smtp.resend.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    EMAIL_FROM: str = "noreply@warizmy.com"
    EMAIL_FROM_NAME: str = "WARIZMY Education"
    
    # =========================================
    # Frontend URLs (für E-Mail-Links)
    # =========================================
    FRONTEND_URL: str = "https://ac.warizmy.com"
    
    # =========================================
    # Sentry (Error Tracking)
    # =========================================
    SENTRY_DSN: Optional[str] = None
    
    # =========================================
    # PVL (Prüfungsvorleistung) - 80% Anwesenheit
    # =========================================
    PVL_ATTENDANCE_THRESHOLD: float = 0.80  # 80%
    
    # =========================================
    # Pydantic Settings Config
    # =========================================
    model_config = SettingsConfigDict(
        # .env Datei laden (falls vorhanden)
        env_file=".env",
        # Groß-/Kleinschreibung ignorieren
        case_sensitive=False,
        # Extra Felder erlauben
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Cached Settings-Instanz zurückgeben.
    Verwendung des @lru_cache Decorators stellt sicher,
    dass die Settings nur einmal geladen werden.
    
    Verwendung:
        from app.config import get_settings
        settings = get_settings()
    """
    return Settings()

