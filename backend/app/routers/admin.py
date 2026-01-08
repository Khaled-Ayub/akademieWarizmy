# ===========================================
# WARIZMY EDUCATION - Admin Router
# ===========================================
# Admin-Endpunkte (Benutzer, Klassen, Zahlungen, etc.)

from typing import List, Optional
from datetime import datetime, date, time
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr
import uuid
import os

from app.db.session import get_db
from app.models import (
    User,
    UserRole,
    Class,
    ClassSchedule,
    ClassEnrollment,
    ClassTeacher,
    SessionType,
    LiveSession,
    Attendance,
    AttendanceStatus,
    Payment,
    PaymentStatus,
    ExamSlot,
    ExamBooking,
    ExamBookingStatus,
    ExamResult,
    Certificate,
    Holiday,
)
from app.routers.auth import get_current_user, require_role, get_password_hash

router = APIRouter()


# =========================================
# Setup-Endpunkt (einmalig Admin erstellen)
# =========================================
SETUP_SECRET = os.getenv("SETUP_SECRET", "warizmy-setup-2024")

@router.get("/setup-admin")
async def setup_admin(
    secret: str = Query(..., description="Setup-Geheimnis"),
    db: AsyncSession = Depends(get_db)
):
    """
    Einmaliger Setup-Endpunkt zum Erstellen des ersten Admin-Benutzers.
    
    Aufruf: /api/admin/setup-admin?secret=warizmy-setup-2024
    
    WICHTIG: Nach Nutzung SETUP_SECRET in Railway ändern oder entfernen!
    """
    # Geheimnis prüfen
    if secret != SETUP_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ungültiges Setup-Geheimnis"
        )
    
    # Admin-Daten
    admin_email = "admin@warizmyacademy.de"
    admin_password = "Warizmy2024!"
    
    # Prüfen ob Admin bereits existiert
    result = await db.execute(
        select(User).where(User.email == admin_email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        if existing_user.role == UserRole.ADMIN:
            return {
                "status": "exists",
                "message": "Admin-Benutzer existiert bereits!",
                "email": admin_email,
                "hint": "Logge dich mit den bekannten Zugangsdaten ein."
            }
        else:
            # Benutzer zu Admin upgraden
            existing_user.role = UserRole.ADMIN
            existing_user.is_active = True
            existing_user.email_verified = True
            await db.commit()
            return {
                "status": "upgraded",
                "message": "Benutzer zu Admin upgegraded!",
                "email": admin_email
            }
    
    # Neuen Admin erstellen
    admin_user = User(
        email=admin_email,
        password_hash=get_password_hash(admin_password),
        first_name="Admin",
        last_name="Warizmy",
        role=UserRole.ADMIN,
        is_active=True,
        email_verified=True,
    )
    
    db.add(admin_user)
    await db.commit()
    
    return {
        "status": "created",
        "message": "✅ Admin-Benutzer erfolgreich erstellt!",
        "email": admin_email,
        "password": admin_password,
        "warning": "⚠️ Bitte ändere das Passwort nach dem ersten Login!"
    }


# =========================================
# Pydantic Schemas
# =========================================
class UserCreateAdmin(BaseModel):
    """Schema für Admin-Benutzer-Erstellung"""
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "student"


class UserUpdateAdmin(BaseModel):
    """Schema für Admin-Benutzer-Update"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class ClassCreate(BaseModel):
    """Schema für Klassen-Erstellung"""
    course_id: str
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    max_students: Optional[int] = None


class ClassScheduleCreate(BaseModel):
    """Schema für Stundenplan-Erstellung"""
    day_of_week: int
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    session_type: str = "hybrid"
    location: Optional[str] = None


class SessionCreate(BaseModel):
    """Schema für Session-Erstellung"""
    class_id: str
    course_id: str
    title: str
    description: Optional[str] = None
    session_type: str = "online"
    location: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int = 90


class AttendanceUpdate(BaseModel):
    """Schema für Anwesenheits-Update"""
    user_id: str
    status: str
    attendance_type: str = "online"
    notes: Optional[str] = None


class ExamSlotCreate(BaseModel):
    """Schema für Prüfungstermin-Erstellung"""
    class_id: str
    course_id: str
    scheduled_at: datetime
    duration_minutes: int = 30


class ExamResultUpdate(BaseModel):
    """Schema für Prüfungsergebnis"""
    result: str  # passed oder failed
    grade: float
    examiner_notes: Optional[str] = None


class HolidayCreate(BaseModel):
    """Schema für Ferien-Erstellung"""
    name: str
    start_date: date
    end_date: date
    applies_to_all: bool = True
    class_id: Optional[str] = None


class CertificateIssue(BaseModel):
    """Schema für Zertifikats-Ausstellung"""
    user_id: str
    course_id: str
    exam_booking_id: Optional[str] = None


# =========================================
# Benutzer-Verwaltung
# =========================================
@router.get("/users")
async def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Alle Benutzer auflisten"""
    query = select(User)
    
    if role:
        query = query.where(User.role == UserRole(role))
    
    if search:
        query = query.where(
            (User.email.ilike(f"%{search}%")) |
            (User.first_name.ilike(f"%{search}%")) |
            (User.last_name.ilike(f"%{search}%"))
        )
    
    query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.post("/users")
async def create_user(
    data: UserCreateAdmin,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Neuen Benutzer erstellen"""
    # E-Mail prüfen
    result = await db.execute(
        select(User).where(User.email == data.email.lower())
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-Mail bereits registriert"
        )
    
    user = User(
        email=data.email.lower(),
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        role=UserRole(data.role),
        is_active=True,
        email_verified=True,  # Admin erstellt → automatisch verifiziert
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {"id": str(user.id), "message": "Benutzer erstellt"}


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Benutzer-Details abrufen (alle Felder)"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        # Adresse
        "address_street": user.address_street,
        "address_city": user.address_city,
        "address_zip": user.address_zip,
        "address_country": user.address_country,
        # Onboarding & Profil
        "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
        "newsletter_opt_in": user.newsletter_opt_in,
        "whatsapp_opt_in": user.whatsapp_opt_in,
        "whatsapp_channel_opt_in": user.whatsapp_channel_opt_in,
        "onboarding_completed": user.onboarding_completed,
        "profile_picture_url": getattr(user, 'profile_picture_url', None),
        # Rolle & Status
        "role": user.role.value,
        "is_active": user.is_active,
        "email_verified": user.email_verified,
        # Timestamps
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    data: UserUpdateAdmin,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Benutzer aktualisieren"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    return {"message": "Benutzer aktualisiert"}


@router.put("/users/{user_id}/role")
async def change_user_role(
    user_id: str,
    role: str,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Benutzerrolle ändern"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    user.role = UserRole(role)
    await db.commit()
    
    return {"message": f"Rolle geändert zu {role}"}


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Benutzer löschen (Admin)"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # Verhindern, dass Admin sich selbst löscht
    if str(user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sie können sich nicht selbst löschen"
        )
    
    await db.delete(user)
    await db.commit()
    
    return None


# =========================================
# Klassen-Verwaltung
# =========================================
@router.get("/classes")
async def list_classes(
    active_only: bool = False,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db)
):
    """Alle Klassen auflisten"""
    query = select(Class).options(selectinload(Class.enrollments))
    
    if active_only:
        query = query.where(Class.is_active == True)
    
    query = query.order_by(Class.start_date.desc())
    
    result = await db.execute(query)
    classes = result.scalars().all()
    
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "course_id": c.course_id,
            "start_date": c.start_date.isoformat(),
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "student_count": len([e for e in c.enrollments if e.status.value == "active"]),
            "max_students": c.max_students,
            "is_active": c.is_active,
        }
        for c in classes
    ]


@router.post("/classes")
async def create_class(
    data: ClassCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Neue Klasse erstellen"""
    class_ = Class(
        course_id=data.course_id,
        name=data.name,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        max_students=data.max_students,
        is_active=True,
    )
    db.add(class_)
    await db.commit()
    await db.refresh(class_)
    
    return {"id": str(class_.id), "message": "Klasse erstellt"}


@router.post("/classes/{class_id}/students")
async def add_student_to_class(
    class_id: str,
    user_id: str,
    enrollment_type: str = "one_time",
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Student zu Klasse hinzufügen"""
    enrollment = ClassEnrollment(
        user_id=user_id,
        class_id=class_id,
        enrollment_type=enrollment_type,
    )
    db.add(enrollment)
    await db.commit()
    
    return {"message": "Student zur Klasse hinzugefügt"}


@router.post("/classes/{class_id}/schedule")
async def add_class_schedule(
    class_id: str,
    data: ClassScheduleCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Stundenplan-Eintrag hinzufügen"""
    start_parts = data.start_time.split(":")
    end_parts = data.end_time.split(":")
    
    schedule = ClassSchedule(
        class_id=class_id,
        day_of_week=data.day_of_week,
        start_time=time(int(start_parts[0]), int(start_parts[1])),
        end_time=time(int(end_parts[0]), int(end_parts[1])),
        session_type=ClassSessionType(data.session_type),
        location=data.location,
    )
    db.add(schedule)
    await db.commit()
    
    return {"message": "Stundenplan-Eintrag hinzugefügt"}


# =========================================
# Session & Anwesenheit
# =========================================
@router.post("/sessions")
async def create_session(
    data: SessionCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db)
):
    """Neue Session erstellen"""
    session = LiveSession(
        class_id=data.class_id,
        course_id=data.course_id,
        title=data.title,
        description=data.description,
        session_type=SessionType(data.session_type),
        location=data.location,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        created_by=current_user.id,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    return {"id": str(session.id), "message": "Session erstellt"}


@router.post("/sessions/{session_id}/cancel")
async def cancel_session(
    session_id: str,
    reason: str = "Abgesagt",
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db)
):
    """Session absagen"""
    result = await db.execute(
        select(LiveSession).where(LiveSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session nicht gefunden")
    
    session.is_cancelled = True
    session.cancel_reason = reason
    await db.commit()
    
    # TODO: Teilnehmer benachrichtigen
    
    return {"message": "Session abgesagt"}


@router.post("/sessions/{session_id}/attendance")
async def record_attendance(
    session_id: str,
    attendances: List[AttendanceUpdate],
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db)
):
    """Anwesenheit eintragen"""
    for a in attendances:
        # Existierende Anwesenheit suchen
        result = await db.execute(
            select(Attendance)
            .where(Attendance.user_id == a.user_id)
            .where(Attendance.live_session_id == session_id)
        )
        attendance = result.scalar_one_or_none()
        
        if attendance:
            attendance.status = AttendanceStatus(a.status)
            attendance.attendance_type = SessionType(a.attendance_type)
            attendance.notes = a.notes
        else:
            attendance = Attendance(
                user_id=a.user_id,
                live_session_id=session_id,
                status=AttendanceStatus(a.status),
                attendance_type=SessionType(a.attendance_type),
                notes=a.notes,
                checked_in_at=datetime.utcnow(),
            )
            db.add(attendance)
    
    await db.commit()
    return {"message": "Anwesenheit gespeichert"}


# =========================================
# Zahlungs-Verwaltung
# =========================================
@router.get("/payments")
async def list_payments(
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Alle Zahlungen auflisten"""
    query = select(Payment).options(selectinload(Payment.user))
    
    if status_filter:
        query = query.where(Payment.payment_status == PaymentStatus(status_filter))
    
    query = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    payments = result.scalars().all()
    
    return [
        {
            "id": str(p.id),
            "user_email": p.user.email if p.user else None,
            "amount": float(p.amount),
            "currency": p.currency,
            "payment_method": p.payment_method.value,
            "payment_status": p.payment_status.value,
            "created_at": p.created_at.isoformat(),
        }
        for p in payments
    ]


@router.put("/payments/{payment_id}/confirm")
async def confirm_bank_transfer(
    payment_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Banküberweisung bestätigen"""
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Zahlung nicht gefunden")
    
    payment.payment_status = PaymentStatus.COMPLETED
    payment.paid_at = datetime.utcnow()
    await db.commit()
    
    # TODO: Benutzer benachrichtigen, Einschreibung aktivieren
    
    return {"message": "Zahlung bestätigt"}


# =========================================
# Prüfungs-Verwaltung
# =========================================
@router.post("/exams/slots")
async def create_exam_slot(
    data: ExamSlotCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db)
):
    """Prüfungstermin erstellen"""
    slot = ExamSlot(
        class_id=data.class_id,
        course_id=data.course_id,
        examiner_id=current_user.id,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    
    return {"id": str(slot.id), "message": "Prüfungstermin erstellt"}


@router.put("/exams/bookings/{booking_id}/result")
async def record_exam_result(
    booking_id: str,
    data: ExamResultUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db)
):
    """Prüfungsergebnis eintragen"""
    result = await db.execute(
        select(ExamBooking).where(ExamBooking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")
    
    booking.result = ExamResult(data.result)
    booking.grade = data.grade
    booking.examiner_notes = data.examiner_notes
    booking.examined_at = datetime.utcnow()
    booking.status = ExamBookingStatus.COMPLETED
    
    await db.commit()
    
    return {"message": "Ergebnis eingetragen"}


# =========================================
# Ferien-Verwaltung
# =========================================
@router.get("/holidays")
async def list_holidays(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Alle Ferien/Feiertage auflisten"""
    result = await db.execute(
        select(Holiday).order_by(Holiday.start_date)
    )
    holidays = result.scalars().all()
    
    return [
        {
            "id": str(h.id),
            "name": h.name,
            "start_date": h.start_date.isoformat(),
            "end_date": h.end_date.isoformat(),
            "applies_to_all": h.applies_to_all,
            "class_id": str(h.class_id) if h.class_id else None,
        }
        for h in holidays
    ]


@router.post("/holidays")
async def create_holiday(
    data: HolidayCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Ferien/Feiertag erstellen"""
    holiday = Holiday(
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date,
        applies_to_all=data.applies_to_all,
        class_id=data.class_id,
    )
    db.add(holiday)
    await db.commit()
    await db.refresh(holiday)
    
    return {"id": str(holiday.id), "message": "Ferien erstellt"}


# =========================================
# Zertifikats-Verwaltung
# =========================================
@router.post("/certificates/issue")
async def issue_certificate(
    data: CertificateIssue,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Zertifikat ausstellen"""
    # Zertifikatsnummer generieren
    year = datetime.utcnow().year
    result = await db.execute(
        select(func.count(Certificate.id))
        .where(Certificate.certificate_number.like(f"WE-CERT-{year}-%"))
    )
    count = result.scalar() or 0
    certificate_number = f"WE-CERT-{year}-{count + 1:05d}"
    
    certificate = Certificate(
        user_id=data.user_id,
        course_id=data.course_id,
        exam_booking_id=data.exam_booking_id,
        certificate_number=certificate_number,
    )
    db.add(certificate)
    await db.commit()
    await db.refresh(certificate)
    
    # TODO: PDF generieren und in MinIO speichern
    
    return {
        "id": str(certificate.id),
        "certificate_number": certificate_number,
        "message": "Zertifikat ausgestellt"
    }


# =========================================
# Dashboard-Statistiken
# =========================================
@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Admin Dashboard Statistiken"""
    # Benutzer zählen
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar()
    
    # Aktive Studenten
    result = await db.execute(
        select(func.count(User.id))
        .where(User.role == UserRole.STUDENT)
        .where(User.is_active == True)
    )
    active_students = result.scalar()
    
    # Aktive Klassen
    result = await db.execute(
        select(func.count(Class.id))
        .where(Class.is_active == True)
    )
    active_classes = result.scalar()
    
    # Heutige Zahlungen
    today = datetime.utcnow().date()
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(Payment.payment_status == PaymentStatus.COMPLETED)
        .where(func.date(Payment.paid_at) == today)
    )
    today_revenue = result.scalar() or 0
    
    # Ausstehende Zahlungen
    result = await db.execute(
        select(func.count(Payment.id))
        .where(Payment.payment_status == PaymentStatus.PENDING)
    )
    pending_payments = result.scalar()
    
    return {
        "total_users": total_users,
        "active_students": active_students,
        "active_classes": active_classes,
        "today_revenue": float(today_revenue),
        "pending_payments": pending_payments,
    }

