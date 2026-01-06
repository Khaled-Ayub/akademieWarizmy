# ===========================================
# WARIZMY EDUCATION - Upload Router
# ===========================================
# Datei-Upload zu MinIO (S3-kompatibel)

import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from minio import Minio
from minio.error import S3Error

from app.core.config import get_settings

router = APIRouter()
settings = get_settings()

# =========================================
# MinIO Client
# =========================================
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


# =========================================
# Erlaubte Dateitypen
# =========================================
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
}

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "text/plain": ".txt",
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}

ALL_ALLOWED_TYPES = {**ALLOWED_IMAGE_TYPES, **ALLOWED_DOCUMENT_TYPES, **ALLOWED_VIDEO_TYPES}

# Max file sizes (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_DOCUMENT_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 MB


# =========================================
# Upload Endpoints
# =========================================
@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(default="images"),
):
    """
    Bild hochladen.
    
    Erlaubte Formate: JPEG, PNG, GIF, WebP, SVG
    Max. Größe: 10 MB
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Dateityp nicht erlaubt. Erlaubt: {', '.join(ALLOWED_IMAGE_TYPES.keys())}"
        )
    
    # Größe prüfen
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Datei zu groß. Maximum: {MAX_IMAGE_SIZE // (1024*1024)} MB"
        )
    
    # Upload durchführen
    return await _upload_file(content, file.content_type, folder, ALLOWED_IMAGE_TYPES)


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(default="documents"),
):
    """
    Dokument hochladen.
    
    Erlaubte Formate: PDF, DOC, DOCX, XLS, XLSX, TXT
    Max. Größe: 50 MB
    """
    if file.content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Dateityp nicht erlaubt. Erlaubt: {', '.join(ALLOWED_DOCUMENT_TYPES.keys())}"
        )
    
    content = await file.read()
    if len(content) > MAX_DOCUMENT_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Datei zu groß. Maximum: {MAX_DOCUMENT_SIZE // (1024*1024)} MB"
        )
    
    return await _upload_file(content, file.content_type, folder, ALLOWED_DOCUMENT_TYPES)


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(default="videos"),
):
    """
    Video hochladen.
    
    Erlaubte Formate: MP4, WebM, MOV
    Max. Größe: 500 MB
    
    Hinweis: Für große Videos empfehlen wir Vimeo.
    """
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Dateityp nicht erlaubt. Erlaubt: {', '.join(ALLOWED_VIDEO_TYPES.keys())}"
        )
    
    content = await file.read()
    if len(content) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Datei zu groß. Maximum: {MAX_VIDEO_SIZE // (1024*1024)} MB"
        )
    
    return await _upload_file(content, file.content_type, folder, ALLOWED_VIDEO_TYPES)


@router.post("/any")
async def upload_any(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(default="uploads"),
):
    """
    Beliebige Datei hochladen (aus erlaubten Typen).
    
    Max. Größe: 50 MB
    """
    if file.content_type not in ALL_ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Dateityp nicht erlaubt: {file.content_type}"
        )
    
    content = await file.read()
    max_size = MAX_VIDEO_SIZE if file.content_type in ALLOWED_VIDEO_TYPES else MAX_DOCUMENT_SIZE
    
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"Datei zu groß. Maximum: {max_size // (1024*1024)} MB"
        )
    
    return await _upload_file(content, file.content_type, folder, ALL_ALLOWED_TYPES)


# =========================================
# Hilfsfunktion
# =========================================
async def _upload_file(
    content: bytes,
    content_type: str,
    folder: str,
    allowed_types: dict
) -> dict:
    """Datei zu MinIO hochladen"""
    try:
        client = get_minio_client()
        bucket_name = settings.MINIO_BUCKET_NAME
        
        # Bucket erstellen falls nötig
        ensure_bucket_exists(client, bucket_name)
        
        # Eindeutigen Dateinamen generieren
        ext = allowed_types.get(content_type, "")
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{folder}/{timestamp}_{unique_id}{ext}"
        
        # Upload zu MinIO
        from io import BytesIO
        client.put_object(
            bucket_name,
            filename,
            BytesIO(content),
            len(content),
            content_type=content_type
        )
        
        # URL generieren
        # Für öffentlichen Zugriff (wenn Bucket public ist)
        protocol = "https" if settings.MINIO_USE_SSL else "http"
        
        # Externe URL (für Browser)
        if settings.MINIO_PUBLIC_URL:
            # Cloudflare R2 oder andere CDN mit Public URL
            external_url = f"{settings.MINIO_PUBLIC_URL}/{filename}"
        elif "localhost" in settings.MINIO_ENDPOINT or "minio" in settings.MINIO_ENDPOINT:
            # Entwicklung: localhost:9000
            external_url = f"http://localhost:9000/{bucket_name}/{filename}"
        else:
            external_url = f"{protocol}://{settings.MINIO_ENDPOINT}/{bucket_name}/{filename}"
        
        return {
            "success": True,
            "url": external_url,
            "filename": filename,
            "size": len(content),
            "content_type": content_type,
        }
        
    except S3Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload fehlgeschlagen: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unerwarteter Fehler: {str(e)}"
        )


@router.delete("/{filename:path}")
async def delete_file(filename: str):
    """
    Datei aus MinIO löschen.
    """
    try:
        client = get_minio_client()
        bucket_name = settings.MINIO_BUCKET_NAME
        
        client.remove_object(bucket_name, filename)
        
        return {"success": True, "deleted": filename}
        
    except S3Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Löschen fehlgeschlagen: {str(e)}"
        )

