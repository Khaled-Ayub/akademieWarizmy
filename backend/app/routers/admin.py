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
    Course,
)
from app.models.class_.class_model import class_courses
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
    course_ids: Optional[List[str]] = None  # Mehrere Kurse


class ClassScheduleCreate(BaseModel):
    """Schema für Stundenplan-Erstellung"""
    day_of_week: int
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    session_type: str = "hybrid"
    location: Optional[str] = None
    location_id: Optional[str] = None
    frequency: Optional[int] = 1  # 1, 2, 3, 4 Wochen
    zoom_join_url: Optional[str] = None


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
    """Alle Benutzer auflisten mit Klassen und Kursen"""
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
    
    # Für jeden Benutzer Klassen und Kurse laden
    user_list = []
    for u in users:
        # Klassen-Einschreibungen mit Kursen laden (Legacy + Many-to-Many)
        enrollments_result = await db.execute(
            select(ClassEnrollment)
            .options(
                selectinload(ClassEnrollment.class_).selectinload(Class.courses),
                selectinload(ClassEnrollment.class_).selectinload(Class.course)  # Legacy 1:1
            )
            .where(ClassEnrollment.user_id == u.id)
        )
        enrollments = enrollments_result.scalars().all()
        
        # Klassen und Kurse extrahieren
        classes = []
        courses_set = set()
        for e in enrollments:
            if e.class_:
                classes.append({
                    "id": str(e.class_.id),
                    "name": e.class_.name,
                    "status": e.status.value
                })
                # Legacy 1:1 Beziehung (Dropdown im Admin)
                if e.class_.course:
                    courses_set.add((str(e.class_.course.id), e.class_.course.title))
                # Many-to-Many Beziehung
                for c in e.class_.courses:
                    courses_set.add((str(c.id), c.title))
        
        courses = [{"id": cid, "title": ctitle} for cid, ctitle in courses_set]
        
        user_list.append({
            "id": str(u.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
            "classes": classes,
            "courses": courses,
            "class_count": len(classes),
            "course_count": len(courses),
        })
    
    return user_list


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
    """Benutzer-Details mit Lernstatistiken abrufen"""
    from app.models import LessonProgress, Lesson
    from app.models.class_.class_model import EnrollmentStatus
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # === Klassen-Einschreibungen mit Kursen laden ===
    enrollments_result = await db.execute(
        select(ClassEnrollment)
        .options(
            selectinload(ClassEnrollment.class_).selectinload(Class.courses),
            selectinload(ClassEnrollment.class_).selectinload(Class.course)  # Legacy 1:1
        )
        .where(ClassEnrollment.user_id == user_id)
    )
    enrollments = enrollments_result.scalars().all()
    
    # Klassen und Kurse extrahieren
    classes = []
    courses_list = []
    course_ids = set()
    class_ids = []
    
    for e in enrollments:
        if e.class_:
            class_ids.append(e.class_.id)
            classes.append({
                "id": str(e.class_.id),
                "name": e.class_.name,
                "status": e.status.value,
                "enrollment_type": e.enrollment_type,
                "started_at": e.started_at.isoformat() if e.started_at else None,
            })
            # Legacy 1:1 Beziehung (Dropdown im Admin)
            if e.class_.course:
                if e.class_.course.id not in course_ids:
                    course_ids.add(e.class_.course.id)
                    courses_list.append({
                        "id": str(e.class_.course.id),
                        "title": e.class_.course.title,
                        "slug": e.class_.course.slug
                    })
            # Many-to-Many Beziehung
            for c in e.class_.courses:
                if c.id not in course_ids:
                    course_ids.add(c.id)
                    courses_list.append({
                        "id": str(c.id),
                        "title": c.title,
                        "slug": c.slug
                    })
    
    # === Fortschritt pro Kurs berechnen ===
    courses_with_progress = []
    for course in courses_list:
        cid = course["id"]
        # Gesamtlektionen
        total_result = await db.execute(
            select(func.count(Lesson.id))
            .where(Lesson.course_id == cid)
            .where(Lesson.is_published == True)
        )
        total_lessons = total_result.scalar() or 0
        
        # Abgeschlossene Lektionen
        completed_result = await db.execute(
            select(func.count(LessonProgress.id))
            .where(LessonProgress.user_id == user_id)
            .where(LessonProgress.course_id == cid)
            .where(LessonProgress.completed == True)
        )
        completed_lessons = completed_result.scalar() or 0
        
        progress = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
        
        courses_with_progress.append({
            **course,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "progress": progress,
        })
    
    # === Anwesenheitsstatistik berechnen ===
    # Alle Sessions der Klassen des Benutzers
    total_sessions = 0
    attended_sessions = 0
    excused_absences = 0
    unexcused_absences = 0
    
    if class_ids:
        # Vergangene Sessions zählen
        sessions_result = await db.execute(
            select(func.count(LiveSession.id))
            .where(LiveSession.class_id.in_(class_ids))
            .where(LiveSession.scheduled_at < datetime.utcnow())
            .where(LiveSession.is_cancelled == False)
        )
        total_sessions = sessions_result.scalar() or 0
        
        # Anwesenheiten zählen
        attendance_result = await db.execute(
            select(Attendance)
            .join(LiveSession, Attendance.live_session_id == LiveSession.id)
            .where(Attendance.user_id == user_id)
            .where(LiveSession.class_id.in_(class_ids))
        )
        attendances = attendance_result.scalars().all()
        
        for a in attendances:
            if a.status == AttendanceStatus.PRESENT:
                attended_sessions += 1
            elif a.status == AttendanceStatus.ABSENT_EXCUSED:
                excused_absences += 1
            elif a.status == AttendanceStatus.ABSENT_UNEXCUSED:
                unexcused_absences += 1
    
    attendance_rate = int((attended_sessions / total_sessions) * 100) if total_sessions > 0 else 0
    
    # === Gesamtfortschritt berechnen ===
    total_progress = 0
    if courses_with_progress:
        total_progress = int(sum(c["progress"] for c in courses_with_progress) / len(courses_with_progress))
    
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
        # === Lernstatistiken ===
        "classes": classes,
        "courses": courses_with_progress,
        "stats": {
            "class_count": len(classes),
            "course_count": len(courses_with_progress),
            "total_progress": total_progress,
            "attendance": {
                "total_sessions": total_sessions,
                "attended": attended_sessions,
                "excused": excused_absences,
                "unexcused": unexcused_absences,
                "rate": attendance_rate,
            }
        }
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
            "course_id": str(c.course_id),
            "start_date": c.start_date.isoformat(),
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "current_students": len([e for e in c.enrollments if e.status.value == "active"]),
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


@router.get("/classes/{class_id}")
async def get_class(
    class_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db)
):
    """Einzelne Klasse mit allen Details abrufen"""
    result = await db.execute(
        select(Class)
        .options(
            selectinload(Class.enrollments),
            selectinload(Class.schedules),
            selectinload(Class.courses),
            selectinload(Class.teachers)
        )
        .where(Class.id == class_id)
    )
    class_ = result.scalar_one_or_none()
    
    if not class_:
        raise HTTPException(status_code=404, detail="Klasse nicht gefunden")
    
    return {
        "id": str(class_.id),
        "name": class_.name,
        "description": class_.description,
        "course_id": str(class_.course_id) if class_.course_id else None,
        "start_date": class_.start_date.isoformat(),
        "end_date": class_.end_date.isoformat() if class_.end_date else None,
        "max_students": class_.max_students,
        "is_active": class_.is_active,
        "current_students": len([e for e in class_.enrollments if e.status.value == "active"]),
        "schedules": [
            {
                "id": str(s.id),
                "day_of_week": s.day_of_week,
                "start_time": s.start_time.strftime("%H:%M") if s.start_time else None,
                "end_time": s.end_time.strftime("%H:%M") if s.end_time else None,
                "session_type": s.session_type.value if s.session_type else "hybrid",
                "location": s.location,
                "location_id": str(s.location_id) if s.location_id else None,
                "frequency": s.frequency or 1,
                "zoom_join_url": s.zoom_join_url,
            }
            for s in class_.schedules
        ],
        "courses": [
            {"id": str(c.id), "title": c.title, "slug": c.slug}
            for c in class_.courses
        ],
        "enrollments": [
            {
                "id": str(e.id),
                "user_id": str(e.user_id),
                "status": e.status.value,
                "enrollment_type": e.enrollment_type,
            }
            for e in class_.enrollments
        ],
    }


@router.put("/classes/{class_id}")
async def update_class(
    class_id: str,
    data: ClassCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Klasse aktualisieren"""
    result = await db.execute(
        select(Class).options(selectinload(Class.courses)).where(Class.id == class_id)
    )
    class_ = result.scalar_one_or_none()
    
    if not class_:
        raise HTTPException(status_code=404, detail="Klasse nicht gefunden")
    
    class_.name = data.name
    class_.description = data.description
    class_.course_id = data.course_id
    class_.start_date = data.start_date
    class_.end_date = data.end_date
    class_.max_students = data.max_students
    
    # Kurse aktualisieren (Many-to-Many)
    if data.course_ids is not None:
        # Alte Kurse entfernen
        class_.courses.clear()
        # Neue Kurse hinzufügen
        for course_id in data.course_ids:
            course_result = await db.execute(
                select(Course).where(Course.id == course_id)
            )
            course = course_result.scalar_one_or_none()
            if course:
                class_.courses.append(course)
    
    await db.commit()
    return {"message": "Klasse aktualisiert"}


@router.post("/classes/{class_id}/courses")
async def add_courses_to_class(
    class_id: str,
    course_ids: List[str],
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Kurse zu Klasse hinzufügen"""
    result = await db.execute(
        select(Class).options(selectinload(Class.courses)).where(Class.id == class_id)
    )
    class_ = result.scalar_one_or_none()
    
    if not class_:
        raise HTTPException(status_code=404, detail="Klasse nicht gefunden")
    
    for course_id in course_ids:
        course_result = await db.execute(
            select(Course).where(Course.id == course_id)
        )
        course = course_result.scalar_one_or_none()
        if course and course not in class_.courses:
            class_.courses.append(course)
    
    await db.commit()
    return {"message": f"{len(course_ids)} Kurs(e) zur Klasse hinzugefügt"}


@router.delete("/classes/{class_id}/courses/{course_id}")
async def remove_course_from_class(
    class_id: str,
    course_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Kurs von Klasse entfernen"""
    result = await db.execute(
        select(Class).options(selectinload(Class.courses)).where(Class.id == class_id)
    )
    class_ = result.scalar_one_or_none()
    
    if not class_:
        raise HTTPException(status_code=404, detail="Klasse nicht gefunden")
    
    course_to_remove = next((c for c in class_.courses if str(c.id) == course_id), None)
    if course_to_remove:
        class_.courses.remove(course_to_remove)
        await db.commit()
    
    return {"message": "Kurs von Klasse entfernt"}


@router.post("/classes/{class_id}/students")
async def add_student_to_class(
    class_id: str,
    user_id: str,
    enrollment_type: str = "one_time",
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Student zu Klasse hinzufügen"""
    # Prüfen ob User existiert
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # Prüfen ob Klasse existiert
    class_result = await db.execute(select(Class).where(Class.id == class_id))
    class_ = class_result.scalar_one_or_none()
    if not class_:
        raise HTTPException(status_code=404, detail="Klasse nicht gefunden")
    
    # Prüfen ob bereits eingeschrieben
    existing = await db.execute(
        select(ClassEnrollment)
        .where(ClassEnrollment.user_id == user_id)
        .where(ClassEnrollment.class_id == class_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Student bereits in dieser Klasse")
    
    enrollment = ClassEnrollment(
        user_id=user_id,
        class_id=class_id,
        enrollment_type=enrollment_type,
    )
    db.add(enrollment)
    await db.commit()
    
    return {"message": "Student zur Klasse hinzugefügt"}


@router.get("/classes/{class_id}/students")
async def get_class_students(
    class_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER)),
    db: AsyncSession = Depends(get_db)
):
    """Alle Studenten einer Klasse abrufen"""
    result = await db.execute(
        select(ClassEnrollment)
        .options(selectinload(ClassEnrollment.user))
        .where(ClassEnrollment.class_id == class_id)
    )
    enrollments = result.scalars().all()
    
    return [
        {
            "enrollment_id": str(e.id),
            "user_id": str(e.user_id),
            "email": e.user.email if e.user else None,
            "first_name": e.user.first_name if e.user else None,
            "last_name": e.user.last_name if e.user else None,
            "status": e.status.value,
            "enrollment_type": e.enrollment_type,
            "started_at": e.started_at.isoformat() if e.started_at else None,
        }
        for e in enrollments
    ]


@router.delete("/classes/{class_id}/students/{user_id}")
async def remove_student_from_class(
    class_id: str,
    user_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Student von Klasse entfernen"""
    result = await db.execute(
        select(ClassEnrollment)
        .where(ClassEnrollment.class_id == class_id)
        .where(ClassEnrollment.user_id == user_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Einschreibung nicht gefunden")
    
    await db.delete(enrollment)
    await db.commit()
    
    return {"message": "Student von Klasse entfernt"}


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
        frequency=data.frequency or 1,
        zoom_join_url=data.zoom_join_url,
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
    from datetime import timedelta
    from app.models import Lesson
    
    # Benutzer zählen
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar() or 0
    
    # Aktive Studenten
    result = await db.execute(
        select(func.count(User.id))
        .where(User.role == UserRole.STUDENT)
        .where(User.is_active == True)
    )
    active_students = result.scalar() or 0
    
    # Lehrer zählen
    result = await db.execute(
        select(func.count(User.id))
        .where(User.role == UserRole.TEACHER)
    )
    total_teachers = result.scalar() or 0
    
    # Kurse zählen
    result = await db.execute(select(func.count(Course.id)))
    total_courses = result.scalar() or 0
    
    # Lektionen zählen
    result = await db.execute(select(func.count(Lesson.id)))
    total_lessons = result.scalar() or 0
    
    # Aktive Klassen
    result = await db.execute(
        select(func.count(Class.id))
        .where(Class.is_active == True)
    )
    active_classes = result.scalar() or 0
    
    # Monatliche Einnahmen
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(Payment.payment_status == PaymentStatus.COMPLETED)
        .where(func.date(Payment.paid_at) >= month_start)
    )
    monthly_revenue = result.scalar() or 0
    
    # Neue Studenten diese Woche
    week_start = today - timedelta(days=today.weekday())
    result = await db.execute(
        select(func.count(User.id))
        .where(User.role == UserRole.STUDENT)
        .where(func.date(User.created_at) >= week_start)
    )
    new_students_week = result.scalar() or 0
    
    # Ausstehende Zahlungen
    result = await db.execute(
        select(func.count(Payment.id))
        .where(Payment.payment_status == PaymentStatus.PENDING)
    )
    pending_payments = result.scalar() or 0
    
    # Unbestätigte Registrierungen
    result = await db.execute(
        select(func.count(User.id))
        .where(User.email_verified == False)
    )
    unverified_users = result.scalar() or 0
    
    return {
        "total_users": total_users,
        "students": active_students,
        "teachers": total_teachers,
        "courses": total_courses,
        "lessons": total_lessons,
        "active_classes": active_classes,
        "monthly_revenue": float(monthly_revenue),
        "new_students_week": new_students_week,
        "pending_payments": pending_payments,
        "unverified_users": unverified_users,
    }


@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Vollständige Admin Dashboard Daten"""
    from datetime import timedelta
    from app.models import Lesson
    
    today = datetime.utcnow()
    
    # === Statistiken ===
    result = await db.execute(
        select(func.count(User.id))
        .where(User.role == UserRole.STUDENT)
        .where(User.is_active == True)
    )
    total_students = result.scalar() or 0
    
    result = await db.execute(select(func.count(Course.id)))
    total_courses = result.scalar() or 0
    
    result = await db.execute(select(func.count(Lesson.id)))
    total_lessons = result.scalar() or 0
    
    # Monatliche Einnahmen
    month_start = today.date().replace(day=1)
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(Payment.payment_status == PaymentStatus.COMPLETED)
        .where(func.date(Payment.paid_at) >= month_start)
    )
    monthly_revenue = result.scalar() or 0
    
    # Neue Studenten diese Woche
    week_start = today.date() - timedelta(days=today.weekday())
    result = await db.execute(
        select(func.count(User.id))
        .where(User.role == UserRole.STUDENT)
        .where(func.date(User.created_at) >= week_start)
    )
    new_students_week = result.scalar() or 0
    
    # === Neue Registrierungen ===
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.STUDENT)
        .order_by(User.created_at.desc())
        .limit(5)
    )
    recent_users = result.scalars().all()
    registrations = [
        {
            "id": str(u.id),
            "name": f"{u.first_name} {u.last_name}",
            "email": u.email,
            "date": u.created_at.strftime("%Y-%m-%d"),
            "status": "verified" if u.email_verified else "pending",
        }
        for u in recent_users
    ]
    
    # === Letzte Zahlungen ===
    result = await db.execute(
        select(Payment)
        .options(selectinload(Payment.user))
        .order_by(Payment.created_at.desc())
        .limit(5)
    )
    recent_payments = result.scalars().all()
    payments = [
        {
            "id": str(p.id),
            "user": f"{p.user.first_name} {p.user.last_name}" if p.user else "Unbekannt",
            "amount": float(p.amount),
            "course": "Kurs",  # TODO: Kursname aus enrollment laden
            "status": p.payment_status.value,
            "date": p.created_at.strftime("%Y-%m-%d"),
        }
        for p in recent_payments
    ]
    
    # === Heutige Sessions ===
    today_start = datetime.combine(today.date(), datetime.min.time())
    today_end = datetime.combine(today.date(), datetime.max.time())
    result = await db.execute(
        select(LiveSession)
        .options(selectinload(LiveSession.class_))
        .where(LiveSession.scheduled_at >= today_start)
        .where(LiveSession.scheduled_at <= today_end)
        .where(LiveSession.is_cancelled == False)
        .order_by(LiveSession.scheduled_at)
    )
    todays_sessions = result.scalars().all()
    sessions = [
        {
            "id": str(s.id),
            "title": s.title,
            "time": s.scheduled_at.strftime("%H:%M"),
            "teacher": "Lehrer",  # TODO: Lehrername laden
            "students": 0,  # TODO: Teilnehmerzahl
        }
        for s in todays_sessions
    ]
    
    # === Ausstehende Aktionen ===
    result = await db.execute(
        select(func.count(User.id))
        .where(User.email_verified == False)
    )
    pending_verifications = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Payment.id))
        .where(Payment.payment_status == PaymentStatus.PENDING)
    )
    pending_payments_count = result.scalar() or 0
    
    return {
        "stats": {
            "students": total_students,
            "courses": total_courses,
            "lessons": total_lessons,
            "revenue": float(monthly_revenue),
            "revenue_change": "+12%",  # TODO: Berechnen
            "new_students_change": f"+{new_students_week}",
        },
        "registrations": registrations,
        "payments": payments,
        "sessions": sessions,
        "pending_actions": {
            "verifications": pending_verifications,
            "payments": pending_payments_count,
        },
    }

