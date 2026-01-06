# ===========================================
# WARIZMY EDUCATION - Storage Service
# ===========================================
# Service für Datei-Uploads zu MinIO

import uuid
from datetime import datetime
from io import BytesIO
from typing import Optional
from fastapi import UploadFile, HTTPException
from minio import Minio
from minio.error import S3Error

from app.core.config import get_settings

settings = get_settings()


def get_minio_client() -> Minio:
    """MinIO Client erstellen"""
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_USE_SSL
    )


def ensure_bucket_exists(client: Minio, bucket_name: str):
    """Bucket erstellen falls nicht vorhanden"""
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)


async def upload_file(
    file: UploadFile,
    folder: str = "uploads",
    max_size_mb: int = 50
) -> str:
    """
    Datei zu MinIO hochladen.
    
    Args:
        file: Die hochzuladende Datei
        folder: Zielordner in MinIO
        max_size_mb: Maximale Dateigröße in MB
        
    Returns:
        URL zur hochgeladenen Datei
    """
    try:
        content = await file.read()
        
        # Größe prüfen
        max_size = max_size_mb * 1024 * 1024
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"Datei zu groß. Maximum: {max_size_mb} MB"
            )
        
        client = get_minio_client()
        bucket_name = settings.MINIO_BUCKET_NAME
        
        # Bucket erstellen falls nötig
        ensure_bucket_exists(client, bucket_name)
        
        # Eindeutigen Dateinamen generieren
        ext = ""
        if file.filename:
            ext = "." + file.filename.split(".")[-1].lower()
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{folder}/{timestamp}_{unique_id}{ext}"
        
        # Upload zu MinIO
        client.put_object(
            bucket_name,
            filename,
            BytesIO(content),
            len(content),
            content_type=file.content_type or "application/octet-stream"
        )
        
        # URL generieren
        protocol = "https" if settings.MINIO_USE_SSL else "http"
        
        # Externe URL (für Browser)
        if settings.MINIO_PUBLIC_URL:
            # Cloudflare R2 oder andere CDN mit Public URL
            external_url = f"{settings.MINIO_PUBLIC_URL}/{filename}"
        elif "localhost" in settings.MINIO_ENDPOINT or "minio" in settings.MINIO_ENDPOINT:
            external_url = f"http://localhost:9000/{bucket_name}/{filename}"
        else:
            external_url = f"{protocol}://{settings.MINIO_ENDPOINT}/{bucket_name}/{filename}"
        
        return external_url
        
    except S3Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload fehlgeschlagen: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unerwarteter Fehler: {str(e)}"
        )


async def delete_file(filename: str) -> bool:
    """
    Datei aus MinIO löschen.
    
    Args:
        filename: Pfad der Datei in MinIO
        
    Returns:
        True wenn erfolgreich gelöscht
    """
    try:
        client = get_minio_client()
        bucket_name = settings.MINIO_BUCKET_NAME
        
        client.remove_object(bucket_name, filename)
        return True
        
    except S3Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Löschen fehlgeschlagen: {str(e)}"
        )

