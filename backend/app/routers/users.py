# ===========================================
# WARIZMY EDUCATION - Users Router
# ===========================================
# Benutzer-Endpunkte (Profil, Kurse, Fortschritt)

from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr
from datetime import datetime, date

from app.db.session import get_db
from app.models import (
    User,
    ClassEnrollment,
    Enrollment,
    LessonProgress,
    Certificate,
    Invoice,
    Course,
    Class,
    ClassSchedule,
    LiveSession,
    AttendanceConfirmation,
    Lesson,
    UserRole,
)
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
    date_of_birth: Optional[date] = None
    newsletter_opt_in: Optional[bool] = None
    whatsapp_opt_in: Optional[bool] = None
    whatsapp_channel_opt_in: Optional[bool] = None
    onboarding_completed: Optional[bool] = None


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
    date_of_birth: Optional[date] = None
    newsletter_opt_in: bool = False
    whatsapp_opt_in: bool = False
    whatsapp_channel_opt_in: bool = False
    onboarding_completed: bool = False
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
    course_id: int
    enrollment_type: str
    status: str
    started_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class EnrollmentResponse(BaseModel):
    """Schema für Seminar-Einschreibung"""
    id: str
    course_id: int
    enrollment_type: str
    status: str
    started_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class LessonProgressResponse(BaseModel):
    """Schema für Lektions-Fortschritt"""
    lesson_id: int
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
    course_id: int
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
        date_of_birth=current_user.date_of_birth,
        newsletter_opt_in=current_user.newsletter_opt_in,
        whatsapp_opt_in=current_user.whatsapp_opt_in,
        whatsapp_channel_opt_in=current_user.whatsapp_channel_opt_in,
        onboarding_completed=current_user.onboarding_completed,
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

    # Convenience: Wenn Onboarding-Felder gesetzt werden, markiere als abgeschlossen
    onboarding_fields = {
        "date_of_birth",
        "newsletter_opt_in",
        "whatsapp_opt_in",
        "whatsapp_channel_opt_in",
    }
    if any(f in update_data for f in onboarding_fields):
        current_user.onboarding_completed = True
    
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
        date_of_birth=current_user.date_of_birth,
        newsletter_opt_in=current_user.newsletter_opt_in,
        whatsapp_opt_in=current_user.whatsapp_opt_in,
        whatsapp_channel_opt_in=current_user.whatsapp_channel_opt_in,
        onboarding_completed=current_user.onboarding_completed,
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
            course_id=e.class_.course_id,
            enrollment_type=e.enrollment_type,
            status=e.status.value,
            started_at=e.started_at,
            expires_at=e.expires_at,
        )
        for e in enrollments
    ]


@router.get("/me/enrollments")
async def get_my_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Alle meine Kurs-Einschreibungen abrufen.
    Enthält sowohl direkte Einschreibungen als auch Kurse über Klassen.
    """
    from sqlalchemy import func
    from app.models.class_.class_model import EnrollmentStatus
    
    enrollments_list = []
    added_course_ids = set()
    
    # 1. Klassen-basierte Kurse
    class_result = await db.execute(
        select(ClassEnrollment)
        .options(
            selectinload(ClassEnrollment.class_).selectinload(Class.course),
            selectinload(ClassEnrollment.class_).selectinload(Class.courses)
        )
        .where(ClassEnrollment.user_id == current_user.id)
        .where(ClassEnrollment.status == EnrollmentStatus.ACTIVE)
    )
    class_enrollments = class_result.scalars().all()
    
    for ce in class_enrollments:
        if not ce.class_:
            continue
        
        # Sammle alle Kurse (Legacy + Many-to-Many)
        courses_to_add = []
        if ce.class_.course:
            courses_to_add.append(ce.class_.course)
        for c in ce.class_.courses:
            courses_to_add.append(c)
        
        for course in courses_to_add:
            if course.id in added_course_ids:
                continue
            added_course_ids.add(course.id)
            
            # Fortschritt berechnen
            total_result = await db.execute(
                select(func.count(Lesson.id))
                .where(Lesson.course_id == course.id)
                .where(Lesson.is_published == True)
            )
            total_lessons = total_result.scalar() or 0
            
            completed_result = await db.execute(
                select(func.count(LessonProgress.id))
                .join(Lesson, LessonProgress.lesson_id == Lesson.id)
                .where(LessonProgress.user_id == current_user.id)
                .where(Lesson.course_id == course.id)
                .where(LessonProgress.completed == True)
            )
            completed_lessons = completed_result.scalar() or 0
            
            progress = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
            
            enrollments_list.append({
                "id": str(ce.id),
                "course": {
                    "id": str(course.id),
                    "title": course.title,
                    "slug": course.slug,
                    "short_description": course.short_description,
                    "thumbnail_url": course.thumbnail_url,
                    "duration_weeks": course.duration_weeks,
                    "total_lessons": total_lessons,
                },
                "progress": progress,
                "completed_lessons": completed_lessons,
                "status": "completed" if progress >= 100 else "active",
                "enrolled_at": ce.started_at.isoformat() if ce.started_at else None,
            })
    
    # 2. Direkte Seminar-Einschreibungen
    direct_result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.course))
        .where(Enrollment.user_id == current_user.id)
        .where(Enrollment.status == "active")
    )
    direct_enrollments = direct_result.scalars().all()
    
    for e in direct_enrollments:
        if not e.course or e.course.id in added_course_ids:
            continue
        added_course_ids.add(e.course.id)
        
        # Fortschritt berechnen
        total_result = await db.execute(
            select(func.count(Lesson.id))
            .where(Lesson.course_id == e.course.id)
            .where(Lesson.is_published == True)
        )
        total_lessons = total_result.scalar() or 0
        
        completed_result = await db.execute(
            select(func.count(LessonProgress.id))
            .join(Lesson, LessonProgress.lesson_id == Lesson.id)
            .where(LessonProgress.user_id == current_user.id)
            .where(Lesson.course_id == e.course.id)
            .where(LessonProgress.completed == True)
        )
        completed_lessons = completed_result.scalar() or 0
        
        progress = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
        
        enrollments_list.append({
            "id": str(e.id),
            "course": {
                "id": str(e.course.id),
                "title": e.course.title,
                "slug": e.course.slug,
                "short_description": e.course.short_description,
                "thumbnail_url": e.course.thumbnail_url,
                "duration_weeks": e.course.duration_weeks,
                "total_lessons": total_lessons,
            },
            "progress": progress,
            "completed_lessons": completed_lessons,
            "status": "completed" if progress >= 100 else "active",
            "enrolled_at": e.started_at.isoformat() if e.started_at else None,
        })
    
    return enrollments_list


@router.get("/me/progress", response_model=List[LessonProgressResponse])
async def get_my_progress(
    course_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meinen Lektions-Fortschritt abrufen.
    
    Optional nach Kurs filtern.
    """
    query = select(LessonProgress).options(
        selectinload(LessonProgress.lesson)
    ).where(LessonProgress.user_id == current_user.id)
    
    if course_id:
        # Join mit Lesson um nach course_id zu filtern
        query = query.join(Lesson, LessonProgress.lesson_id == Lesson.id).where(
            Lesson.course_id == uuid.UUID(course_id)
        )
    
    result = await db.execute(query)
    progress = result.scalars().all()
    
    return [
        LessonProgressResponse(
            lesson_id=p.lesson_id,
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
            course_id=c.course_id,
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


# =========================================
# Dashboard-Endpunkte
# =========================================
@router.get("/me/dashboard")
async def get_student_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Studenten-Dashboard Daten abrufen.
    
    Enthält:
    - Statistiken (aktive Kurse, Fortschritt, Sessions, Zertifikate)
    - Kommende Sessions
    - Meine Kurse mit Fortschritt
    - PVL-Status (falls vorhanden)
    """
    from datetime import timedelta
    from sqlalchemy import func
    from app.models.class_.class_model import EnrollmentStatus
    
    now = datetime.utcnow()
    
    # === Meine Klassen-IDs abrufen ===
    result = await db.execute(
        select(ClassEnrollment)
        .options(
            selectinload(ClassEnrollment.class_)
            .selectinload(Class.course),
            selectinload(ClassEnrollment.class_)
            .selectinload(Class.courses)  # Many-to-Many Kurse
        )
        .where(ClassEnrollment.user_id == current_user.id)
        .where(ClassEnrollment.status == EnrollmentStatus.ACTIVE)
    )
    class_enrollments = result.scalars().all()
    class_ids = [e.class_id for e in class_enrollments]
    
    # === Statistiken ===
    # Aktive Kurse (unique) - aus Klassen
    unique_courses = set()
    for e in class_enrollments:
        if e.class_:
            # Legacy 1:1 Beziehung
            if e.class_.course:
                unique_courses.add(e.class_.course_id)
            # Many-to-Many Beziehung
            for c in e.class_.courses:
                unique_courses.add(c.id)
    
    # Direkte Einschreibungen zählen
    result = await db.execute(
        select(Enrollment.course_id)
        .where(Enrollment.user_id == current_user.id)
        .where(Enrollment.status == "active")
    )
    for row in result.all():
        if row[0]:
            unique_courses.add(row[0])
    
    active_courses = len(unique_courses)
    
    # Zertifikate
    result = await db.execute(
        select(func.count(Certificate.id))
        .where(Certificate.user_id == current_user.id)
    )
    certificate_count = result.scalar() or 0
    
    # Sessions diese Woche
    week_end = now + timedelta(days=7)
    sessions_this_week = 0
    if class_ids:
        result = await db.execute(
            select(func.count(LiveSession.id))
            .where(LiveSession.class_id.in_(class_ids))
            .where(LiveSession.scheduled_at >= now)
            .where(LiveSession.scheduled_at <= week_end)
            .where(LiveSession.is_cancelled == False)
        )
        sessions_this_week = result.scalar() or 0
    
    # Durchschnittlicher Fortschritt
    result = await db.execute(
        select(LessonProgress)
        .where(LessonProgress.user_id == current_user.id)
    )
    progress_entries = result.scalars().all()
    avg_progress = 0
    if progress_entries:
        completed = len([p for p in progress_entries if p.completed])
        avg_progress = int((completed / len(progress_entries)) * 100) if progress_entries else 0
    
    # === Kommende Sessions ===
    upcoming_sessions = []
    if class_ids:
        result = await db.execute(
            select(LiveSession)
            .options(selectinload(LiveSession.class_))
            .where(LiveSession.class_id.in_(class_ids))
            .where(LiveSession.scheduled_at >= now)
            .where(LiveSession.is_cancelled == False)
            .order_by(LiveSession.scheduled_at)
            .limit(5)
        )
        sessions = result.scalars().all()
        
        # Bestätigungen laden
        session_ids = [s.id for s in sessions]
        result = await db.execute(
            select(AttendanceConfirmation)
            .where(AttendanceConfirmation.user_id == current_user.id)
            .where(AttendanceConfirmation.live_session_id.in_(session_ids))
        )
        confirmations = {c.live_session_id: c for c in result.scalars().all()}
        
        for s in sessions:
            conf = confirmations.get(s.id)
            upcoming_sessions.append({
                "id": str(s.id),
                "title": s.title,
                "course": s.class_.name if s.class_ else "Unbekannt",
                "date": s.scheduled_at.strftime("%Y-%m-%d"),
                "time": s.scheduled_at.strftime("%H:%M"),
                "duration": s.duration_minutes,
                "type": s.session_type.value,
                "teacher": "Lehrer",  # TODO: Teacher name
                "confirmed": conf.will_attend if conf else None,
            })
    
    # === Meine Kurse mit Fortschritt ===
    my_courses = []
    added_course_ids = set()
    
    # 1. Kurse aus Klassen-Einschreibungen
    for enrollment in class_enrollments:
        if not enrollment.class_:
            continue
        
        # Sammle alle Kurse (Legacy + Many-to-Many)
        courses_to_add = []
        if enrollment.class_.course:
            courses_to_add.append(enrollment.class_.course)
        for c in enrollment.class_.courses:
            courses_to_add.append(c)
        
        for course in courses_to_add:
            # Duplikate vermeiden
            if course.id in added_course_ids:
                continue
            added_course_ids.add(course.id)
            
            # Lektionen für diesen Kurs
            result = await db.execute(
                select(func.count(Lesson.id))
                .where(Lesson.course_id == course.id)
                .where(Lesson.is_published == True)
            )
            total_lessons = result.scalar() or 0
            
            # Abgeschlossene Lektionen
            result = await db.execute(
                select(func.count(LessonProgress.id))
                .where(LessonProgress.user_id == current_user.id)
                .where(LessonProgress.lesson_id.in_(
                    select(Lesson.id).where(Lesson.course_id == course.id)
                ))
                .where(LessonProgress.completed == True)
            )
            completed_lessons = result.scalar() or 0
            
            progress = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
            
            my_courses.append({
                "id": str(course.id),
                "title": course.title,
                "progress": progress,
                "next_lesson": "Nächste Lektion",
                "total_lessons": total_lessons,
                "completed_lessons": completed_lessons,
            })
    
    # 2. Direkte Kurs-Einschreibungen (Seminare ohne Klasse)
    result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.course))
        .where(Enrollment.user_id == current_user.id)
        .where(Enrollment.status == "active")
    )
    direct_enrollments = result.scalars().all()
    
    for enrollment in direct_enrollments:
        if not enrollment.course:
            continue
        course = enrollment.course
        
        # Duplikate vermeiden
        if course.id in added_course_ids:
            continue
        added_course_ids.add(course.id)
        
        # Lektionen für diesen Kurs
        result = await db.execute(
            select(func.count(Lesson.id))
            .where(Lesson.course_id == course.id)
            .where(Lesson.is_published == True)
        )
        total_lessons = result.scalar() or 0
        
        # Abgeschlossene Lektionen
        result = await db.execute(
            select(func.count(LessonProgress.id))
            .where(LessonProgress.user_id == current_user.id)
            .where(LessonProgress.lesson_id.in_(
                select(Lesson.id).where(Lesson.course_id == course.id)
            ))
            .where(LessonProgress.completed == True)
        )
        completed_lessons = result.scalar() or 0
        
        progress = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
        
        my_courses.append({
            "id": str(course.id),
            "title": course.title,
            "progress": progress,
            "next_lesson": "Nächste Lektion",
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
        })
    
    # === PVL Status (erstes Kurs mit PVL-Anforderung) ===
    pvl_status = None
    if my_courses:
        first_course = my_courses[0]
        pvl_status = {
            "course_name": first_course["title"],
            "attendance_required": 80,
            "current_attendance": 85,  # TODO: Tatsächliche Anwesenheit berechnen
            "videos_required": 80,
            "current_videos": first_course["progress"],
            "can_take_exam": first_course["progress"] >= 80,
        }
    
    return {
        "stats": {
            "active_courses": active_courses,
            "avg_progress": avg_progress,
            "sessions_this_week": sessions_this_week,
            "certificates": certificate_count,
        },
        "upcoming_sessions": upcoming_sessions,
        "my_courses": my_courses,
        "pvl_status": pvl_status,
    }


@router.get("/me/attendance")
async def get_my_attendance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Anwesenheitsdaten des Schülers abrufen.
    """
    from sqlalchemy import func
    from app.models import Attendance, AttendanceStatus, LiveSession
    from app.models.class_.class_model import EnrollmentStatus
    
    # === Meine Klassen ===
    result = await db.execute(
        select(ClassEnrollment)
        .options(selectinload(ClassEnrollment.class_).selectinload(Class.course))
        .where(ClassEnrollment.user_id == current_user.id)
        .where(ClassEnrollment.status == EnrollmentStatus.ACTIVE)
    )
    class_enrollments = result.scalars().all()
    class_ids = [e.class_id for e in class_enrollments]
    
    # === Kurse mit Anwesenheit ===
    courses = []
    for enrollment in class_enrollments:
        if not enrollment.class_ or not enrollment.class_.course:
            continue
        cls = enrollment.class_
        course = cls.course
        
        # Sessions für diese Klasse zählen
        result = await db.execute(
            select(func.count(LiveSession.id))
            .where(LiveSession.class_id == cls.id)
            .where(LiveSession.is_cancelled == False)
            .where(LiveSession.scheduled_at <= datetime.utcnow())
        )
        total_sessions = result.scalar() or 0
        
        if total_sessions == 0:
            continue
        
        # Anwesenheiten zählen
        result = await db.execute(
            select(func.count(Attendance.id))
            .join(LiveSession, Attendance.live_session_id == LiveSession.id)
            .where(LiveSession.class_id == cls.id)
            .where(Attendance.user_id == current_user.id)
            .where(Attendance.status == AttendanceStatus.PRESENT)
        )
        attended = result.scalar() or 0
        
        result = await db.execute(
            select(func.count(Attendance.id))
            .join(LiveSession, Attendance.live_session_id == LiveSession.id)
            .where(LiveSession.class_id == cls.id)
            .where(Attendance.user_id == current_user.id)
            .where(Attendance.status == AttendanceStatus.ABSENT_UNEXCUSED)
        )
        absent = result.scalar() or 0
        
        result = await db.execute(
            select(func.count(Attendance.id))
            .join(LiveSession, Attendance.live_session_id == LiveSession.id)
            .where(LiveSession.class_id == cls.id)
            .where(Attendance.user_id == current_user.id)
            .where(Attendance.status == AttendanceStatus.ABSENT_EXCUSED)
        )
        excused = result.scalar() or 0
        
        attendance_rate = int((attended / total_sessions) * 100) if total_sessions > 0 else 0
        
        courses.append({
            "course_id": str(course.id),
            "course_name": course.title,
            "total_sessions": total_sessions,
            "attended": attended,
            "absent": absent,
            "excused": excused,
            "attendance_rate": attendance_rate,
            "required_rate": 80,
        })
    
    # === Letzte Anwesenheitseinträge ===
    records = []
    if class_ids:
        result = await db.execute(
            select(Attendance)
            .options(
                selectinload(Attendance.live_session).selectinload(LiveSession.class_)
            )
            .join(LiveSession, Attendance.live_session_id == LiveSession.id)
            .where(LiveSession.class_id.in_(class_ids))
            .where(Attendance.user_id == current_user.id)
            .order_by(LiveSession.scheduled_at.desc())
            .limit(20)
        )
        attendances = result.scalars().all()
        
        for a in attendances:
            session = a.live_session
            if not session:
                continue
            
            status_map = {
                AttendanceStatus.PRESENT: "present",
                AttendanceStatus.ABSENT_EXCUSED: "excused",
                AttendanceStatus.ABSENT_UNEXCUSED: "absent",
            }
            
            records.append({
                "id": str(a.id),
                "session_title": session.title,
                "course_name": session.class_.name if session.class_ else "Unbekannt",
                "date": session.scheduled_at.strftime("%Y-%m-%d"),
                "time": session.scheduled_at.strftime("%H:%M"),
                "status": status_map.get(a.status, "pending"),
            })
    
    return {
        "courses": courses,
        "records": records,
    }


@router.get("/me/teacher-dashboard")
async def get_teacher_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lehrer-Dashboard Daten abrufen.
    
    Enthält:
    - Statistiken (Klassen, Studenten, Sessions)
    - Heutige Sessions
    - Meine Klassen
    - Anstehende Prüfungen
    - Anwesenheit die Überprüfung braucht
    """
    from datetime import timedelta
    from sqlalchemy import func
    from app.models import ClassTeacher, ExamBooking, ExamSlot, Attendance, AttendanceStatus
    
    # Nur für Lehrer und Admins
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        return {
            "stats": {"classes": 0, "students": 0, "sessions_today": 0, "sessions_week": 0, "pending_exams": 0},
            "todays_sessions": [],
            "my_classes": [],
            "pending_exams": [],
            "attendance_alerts": [],
        }
    
    now = datetime.utcnow()
    today = now.date()
    
    # === Meine Klassen (als Lehrer) ===
    result = await db.execute(
        select(ClassTeacher.class_id)
        .where(ClassTeacher.teacher_id == current_user.id)
    )
    teacher_class_ids = [row[0] for row in result.all()]
    
    # Falls Admin, alle aktiven Klassen
    if current_user.role == UserRole.ADMIN:
        result = await db.execute(
            select(Class.id)
            .where(Class.is_active == True)
        )
        teacher_class_ids = [row[0] for row in result.all()]
    
    # === Klassen laden ===
    my_classes = []
    total_students = 0
    if teacher_class_ids:
        result = await db.execute(
            select(Class)
            .options(
                selectinload(Class.course),
                selectinload(Class.enrollments),
            )
            .where(Class.id.in_(teacher_class_ids))
            .where(Class.is_active == True)
        )
        classes = result.scalars().all()
        
        for c in classes:
            student_count = len([e for e in c.enrollments if e.status.value == "active"])
            total_students += student_count
            
            # Nächste Session für diese Klasse
            result = await db.execute(
                select(LiveSession)
                .where(LiveSession.class_id == c.id)
                .where(LiveSession.scheduled_at >= now)
                .where(LiveSession.is_cancelled == False)
                .order_by(LiveSession.scheduled_at)
                .limit(1)
            )
            next_session = result.scalar_one_or_none()
            
            my_classes.append({
                "id": str(c.id),
                "name": c.name,
                "course": c.course.title if c.course else "Unbekannt",
                "students": student_count,
                "next_session": next_session.scheduled_at.isoformat() if next_session else None,
                "progress": 50,  # TODO: Tatsächlichen Fortschritt berechnen
            })
    
    # === Heutige Sessions ===
    todays_sessions = []
    if teacher_class_ids:
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        result = await db.execute(
            select(LiveSession)
            .options(selectinload(LiveSession.class_))
            .where(LiveSession.class_id.in_(teacher_class_ids))
            .where(LiveSession.scheduled_at >= today_start)
            .where(LiveSession.scheduled_at <= today_end)
            .where(LiveSession.is_cancelled == False)
            .order_by(LiveSession.scheduled_at)
        )
        sessions = result.scalars().all()
        
        for s in sessions:
            # Bestätigungen zählen
            result = await db.execute(
                select(func.count(AttendanceConfirmation.id))
                .where(AttendanceConfirmation.live_session_id == s.id)
                .where(AttendanceConfirmation.will_attend == True)
            )
            confirmed = result.scalar() or 0
            
            # Gesamtanzahl Studenten in der Klasse
            result = await db.execute(
                select(func.count(ClassEnrollment.id))
                .where(ClassEnrollment.class_id == s.class_id)
                .where(ClassEnrollment.status == "active")
            )
            total_class_students = result.scalar() or 0
            
            todays_sessions.append({
                "id": str(s.id),
                "title": s.title,
                "class": s.class_.name if s.class_ else "Unbekannt",
                "time": s.scheduled_at.strftime("%H:%M"),
                "duration": s.duration_minutes,
                "type": s.session_type.value,
                "students": total_class_students,
                "confirmed": confirmed,
                "location": s.location or "Online",
                "status": "upcoming" if s.scheduled_at > now else "live" if s.scheduled_at <= now else "completed",
            })
    
    # === Sessions diese Woche ===
    sessions_today = len(todays_sessions)
    week_end = now + timedelta(days=7)
    result = await db.execute(
        select(func.count(LiveSession.id))
        .where(LiveSession.class_id.in_(teacher_class_ids) if teacher_class_ids else False)
        .where(LiveSession.scheduled_at >= now)
        .where(LiveSession.scheduled_at <= week_end)
        .where(LiveSession.is_cancelled == False)
    )
    sessions_week = result.scalar() or 0 if teacher_class_ids else 0
    
    # === Anstehende Prüfungen ===
    pending_exams = []
    # TODO: Implementieren wenn ExamBooking Daten vorhanden
    
    # === Anwesenheits-Alerts ===
    attendance_alerts = []
    # TODO: Sessions die noch Anwesenheitsüberprüfung brauchen
    
    return {
        "stats": {
            "classes": len(my_classes),
            "students": total_students,
            "sessions_today": sessions_today,
            "sessions_week": sessions_week,
            "pending_exams": len(pending_exams),
        },
        "todays_sessions": todays_sessions,
        "my_classes": my_classes,
        "pending_exams": pending_exams,
        "attendance_alerts": attendance_alerts,
    }

