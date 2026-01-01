# ===========================================
# WARIZMY EDUCATION - Certificates Router
# ===========================================
# Zertifikats-Endpunkte (Download, Verifizierung)

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.certificate import Certificate
from app.routers.auth import get_current_user

router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================
class CertificateResponse(BaseModel):
    """Schema für Zertifikat"""
    id: str
    strapi_course_id: int
    certificate_number: str
    issued_at: datetime
    has_pdf: bool
    verification_url: str
    
    class Config:
        from_attributes = True


class CertificateVerification(BaseModel):
    """Schema für Zertifikats-Verifizierung"""
    valid: bool
    certificate_number: str
    holder_name: str
    course_id: int
    issued_at: datetime


# =========================================
# API Endpunkte
# =========================================
@router.get("/", response_model=List[CertificateResponse])
async def get_my_certificates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meine Zertifikate abrufen.
    """
    result = await db.execute(
        select(Certificate)
        .where(Certificate.user_id == current_user.id)
        .order_by(Certificate.issued_at.desc())
    )
    certificates = result.scalars().all()
    
    return [
        CertificateResponse(
            id=str(c.id),
            strapi_course_id=c.strapi_course_id,
            certificate_number=c.certificate_number,
            issued_at=c.issued_at,
            has_pdf=c.pdf_path is not None,
            verification_url=c.verification_url,
        )
        for c in certificates
    ]


@router.get("/{certificate_id}/download")
async def download_certificate(
    certificate_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Zertifikat als PDF herunterladen.
    """
    result = await db.execute(
        select(Certificate)
        .where(Certificate.id == certificate_id)
        .where(Certificate.user_id == current_user.id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zertifikat nicht gefunden"
        )
    
    if not certificate.pdf_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF nicht verfügbar"
        )
    
    # TODO: PDF aus MinIO laden und streamen
    # from app.services.storage_service import storage_service
    # pdf_data = await storage_service.get_file(certificate.pdf_path)
    # 
    # return StreamingResponse(
    #     pdf_data,
    #     media_type="application/pdf",
    #     headers={
    #         "Content-Disposition": f"attachment; filename={certificate.certificate_number}.pdf"
    #     }
    # )
    
    return {"message": "PDF-Download wird noch implementiert"}


@router.get("/verify/{certificate_number}", response_model=CertificateVerification)
async def verify_certificate(
    certificate_number: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Zertifikat verifizieren (öffentlicher Endpunkt).
    
    Ermöglicht die Überprüfung der Echtheit eines Zertifikats
    durch Eingabe der Zertifikatsnummer.
    """
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Certificate)
        .options(selectinload(Certificate.user))
        .where(Certificate.certificate_number == certificate_number)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zertifikat nicht gefunden oder ungültige Zertifikatsnummer"
        )
    
    return CertificateVerification(
        valid=True,
        certificate_number=certificate.certificate_number,
        holder_name=certificate.user.full_name,
        course_id=certificate.strapi_course_id,
        issued_at=certificate.issued_at,
    )

