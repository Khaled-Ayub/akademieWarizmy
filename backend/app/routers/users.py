# ===========================================
# WARIZMY EDUCATION - Users Router
# ===========================================
# Benutzer-Endpunkte (Profil, Kurse, Fortschritt)

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.class_model import ClassEnrollment
from app.models.enrollment import Enrollment, LessonProgress
from app.models.certificate import Certificate
from app.models.payment import Invoice
from app.routers.auth import get_current_user

router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================
class UserUpdate(BaseModel):
    """Schema für Benutzer-Update"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_zip: Optional[str] = None
    address_country: Optional[str] = None


class UserProfile(BaseModel):
    """Schema für Benutzerprofil"""
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    address_street: Optional[str]
    address_city: Optional[str]
    address_zip: Optional[str]
    address_country: Optional[str]
    role: str
    email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ClassEnrollmentResponse(BaseModel):
    """Schema für Klassen-Einschreibung"""
    id: str
    class_id: str
    class_name: str
    strapi_course_id: int
    enrollment_type: str
    status: str
    started_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class EnrollmentResponse(BaseModel):
    """Schema für Seminar-Einschreibung"""
    id: str
    strapi_course_id: int
    enrollment_type: str
    status: str
    started_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class LessonProgressResponse(BaseModel):
    """Schema für Lektions-Fortschritt"""
    strapi_lesson_id: int
    strapi_course_id: int
    watched_seconds: int
    completed: bool
    completed_at: Optional[datetime]
    quiz_score: Optional[int]
    quiz_passed: Optional[bool]
    
    class Config:
        from_attributes = True


class CertificateResponse(BaseModel):
    """Schema für Zertifikat"""
    id: str
    strapi_course_id: int
    certificate_number: str
    issued_at: datetime
    pdf_path: Optional[str]
    
    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    """Schema für Rechnung"""
    id: str
    invoice_number: str
    amount: float
    tax_amount: float
    total_amount: float
    issued_at: datetime
    pdf_path: Optional[str]
    
    class Config:
        from_attributes = True


# =========================================
# API Endpunkte
# =========================================
@router.get("/me", response_model=UserProfile)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Eigenes Profil abrufen.
    """
    return UserProfile(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        address_street=current_user.address_street,
        address_city=current_user.address_city,
        address_zip=current_user.address_zip,
        address_country=current_user.address_country,
        role=current_user.role.value,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at,
    )


@router.put("/me", response_model=UserProfile)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Eigenes Profil aktualisieren.
    """
    # Nur übergebene Felder aktualisieren
    update_data = user_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserProfile(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        address_street=current_user.address_street,
        address_city=current_user.address_city,
        address_zip=current_user.address_zip,
        address_country=current_user.address_country,
        role=current_user.role.value,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at,
    )


@router.get("/me/classes", response_model=List[ClassEnrollmentResponse])
async def get_my_classes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meine Klassen-Einschreibungen abrufen.
    """
    result = await db.execute(
        select(ClassEnrollment)
        .options(selectinload(ClassEnrollment.class_))
        .where(ClassEnrollment.user_id == current_user.id)
    )
    enrollments = result.scalars().all()
    
    return [
        ClassEnrollmentResponse(
            id=str(e.id),
            class_id=str(e.class_id),
            class_name=e.class_.name,
            strapi_course_id=e.class_.strapi_course_id,
            enrollment_type=e.enrollment_type,
            status=e.status.value,
            started_at=e.started_at,
            expires_at=e.expires_at,
        )
        for e in enrollments
    ]


@router.get("/me/enrollments", response_model=List[EnrollmentResponse])
async def get_my_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meine Seminar-Einschreibungen (ohne Klasse) abrufen.
    """
    result = await db.execute(
        select(Enrollment)
        .where(Enrollment.user_id == current_user.id)
    )
    enrollments = result.scalars().all()
    
    return [
        EnrollmentResponse(
            id=str(e.id),
            strapi_course_id=e.strapi_course_id,
            enrollment_type=e.enrollment_type.value,
            status=e.status.value,
            started_at=e.started_at,
            expires_at=e.expires_at,
        )
        for e in enrollments
    ]


@router.get("/me/progress", response_model=List[LessonProgressResponse])
async def get_my_progress(
    course_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meinen Lektions-Fortschritt abrufen.
    
    Optional nach Kurs filtern.
    """
    query = select(LessonProgress).where(LessonProgress.user_id == current_user.id)
    
    if course_id:
        query = query.where(LessonProgress.strapi_course_id == course_id)
    
    result = await db.execute(query)
    progress = result.scalars().all()
    
    return [
        LessonProgressResponse(
            strapi_lesson_id=p.strapi_lesson_id,
            strapi_course_id=p.strapi_course_id,
            watched_seconds=p.watched_seconds,
            completed=p.completed,
            completed_at=p.completed_at,
            quiz_score=p.quiz_score,
            quiz_passed=p.quiz_passed,
        )
        for p in progress
    ]


@router.get("/me/certificates", response_model=List[CertificateResponse])
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
            pdf_path=c.pdf_path,
        )
        for c in certificates
    ]


@router.get("/me/invoices", response_model=List[InvoiceResponse])
async def get_my_invoices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meine Rechnungen abrufen.
    """
    result = await db.execute(
        select(Invoice)
        .where(Invoice.user_id == current_user.id)
        .order_by(Invoice.issued_at.desc())
    )
    invoices = result.scalars().all()
    
    return [
        InvoiceResponse(
            id=str(i.id),
            invoice_number=i.invoice_number,
            amount=float(i.amount),
            tax_amount=float(i.tax_amount),
            total_amount=float(i.total_amount),
            issued_at=i.issued_at,
            pdf_path=i.pdf_path,
        )
        for i in invoices
    ]

