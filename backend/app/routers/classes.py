# ===========================================
# WARIZMY EDUCATION - Classes Router
# ===========================================
# Klassen-Endpunkte (Übersicht, Details, Stundenplan)

from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.db.session import get_db
from app.models import (
    User,
    UserRole,
    Class,
    ClassSchedule,
    ClassEnrollment,
    LiveSession,
)
from app.routers.auth import get_current_user, require_role

router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================
class ClassScheduleResponse(BaseModel):
    """Schema für Stundenplan-Eintrag"""
    id: str
    day_of_week: int
    day_name: str
    start_time: str
    end_time: str
    session_type: str
    location: Optional[str]
    
    class Config:
        from_attributes = True


class ClassResponse(BaseModel):
    """Schema für Klasse"""
    id: str
    course_id: str
    name: str
    description: Optional[str]
    start_date: date
    end_date: Optional[date]
    max_students: Optional[int]
    current_students: int
    is_active: bool
    schedules: List[ClassScheduleResponse]
    
    class Config:
        from_attributes = True


class ClassDetailResponse(ClassResponse):
    """Schema für Klassen-Details mit Sessions"""
    upcoming_sessions: List[dict]


class StudentResponse(BaseModel):
    """Schema für Student in Klasse"""
    id: str
    first_name: str
    last_name: str
    email: str
    enrollment_status: str
    started_at: datetime
    
    class Config:
        from_attributes = True


# =========================================
# Helper-Funktionen
# =========================================
def day_name(day: int) -> str:
    """Wochentag als Text"""
    days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    return days[day] if 0 <= day <= 6 else "Unbekannt"


# =========================================
# Pydantic Schemas für Create/Update
# =========================================
class ClassCreate(BaseModel):
    """Schema für Klasse erstellen"""
    course_id: str
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    max_students: Optional[int] = None
    is_active: bool = True


class ScheduleCreate(BaseModel):
    """Schema für Schedule erstellen"""
    day_of_week: int
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    session_type: str = "online"
    location: Optional[str] = None
    zoom_join_url: Optional[str] = None


# =========================================
# API Endpunkte - Admin
# =========================================
@router.get("/admin", response_model=List[ClassResponse])
async def admin_get_all_classes(
    db: AsyncSession = Depends(get_db)
):
    """
    Alle Klassen abrufen (Admin).
    """
    result = await db.execute(
        select(Class)
        .options(
            selectinload(Class.schedules),
            selectinload(Class.enrollments),
        )
        .order_by(Class.start_date.desc())
    )
    classes = result.scalars().all()
    
    return [
        ClassResponse(
            id=str(c.id),
            course_id=str(c.course_id),
            name=c.name,
            description=c.description,
            start_date=c.start_date,
            end_date=c.end_date,
            max_students=c.max_students,
            current_students=len([e for e in c.enrollments if e.status.value == "active"]),
            is_active=c.is_active,
            schedules=[
                ClassScheduleResponse(
                    id=str(s.id),
                    day_of_week=s.day_of_week,
                    day_name=day_name(s.day_of_week),
                    start_time=s.start_time.strftime("%H:%M"),
                    end_time=s.end_time.strftime("%H:%M"),
                    session_type=s.session_type.value,
                    location=s.location,
                )
                for s in c.schedules
            ],
        )
        for c in classes
    ]


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    class_data: ClassCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Neue Klasse erstellen.
    """
    from uuid import UUID
    
    new_class = Class(
        course_id=UUID(class_data.course_id),
        name=class_data.name,
        description=class_data.description,
        start_date=class_data.start_date,
        end_date=class_data.end_date,
        max_students=class_data.max_students,
        is_active=class_data.is_active,
    )
    
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    
    return ClassResponse(
        id=str(new_class.id),
        course_id=str(new_class.course_id),
        name=new_class.name,
        description=new_class.description,
        start_date=new_class.start_date,
        end_date=new_class.end_date,
        max_students=new_class.max_students,
        current_students=0,
        is_active=new_class.is_active,
        schedules=[],
    )


@router.post("/{class_id}/schedules", response_model=ClassScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    class_id: str,
    schedule_data: ScheduleCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Schedule zu einer Klasse hinzufügen.
    """
    from uuid import UUID
    from datetime import time
    from app.models.class_ import SessionType
    
    # Klasse prüfen
    result = await db.execute(select(Class).where(Class.id == class_id))
    class_ = result.scalar_one_or_none()
    
    if not class_:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Klasse nicht gefunden"
        )
    
    # Zeit parsen (HH:MM)
    start_parts = schedule_data.start_time.split(":")
    end_parts = schedule_data.end_time.split(":")
    
    new_schedule = ClassSchedule(
        class_id=UUID(class_id),
        day_of_week=schedule_data.day_of_week,
        start_time=time(int(start_parts[0]), int(start_parts[1])),
        end_time=time(int(end_parts[0]), int(end_parts[1])),
        session_type=SessionType(schedule_data.session_type),
        location=schedule_data.location,
        zoom_join_url=schedule_data.zoom_join_url,
    )
    
    db.add(new_schedule)
    await db.commit()
    await db.refresh(new_schedule)
    
    return ClassScheduleResponse(
        id=str(new_schedule.id),
        day_of_week=new_schedule.day_of_week,
        day_name=day_name(new_schedule.day_of_week),
        start_time=new_schedule.start_time.strftime("%H:%M"),
        end_time=new_schedule.end_time.strftime("%H:%M"),
        session_type=new_schedule.session_type.value,
        location=new_schedule.location,
    )


# =========================================
# API Endpunkte - User
# =========================================
@router.get("/{class_id}", response_model=ClassDetailResponse)
async def get_class(
    class_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Klassen-Details abrufen.
    
    Student muss in der Klasse eingeschrieben sein (oder Admin/Teacher).
    """
    # Klasse laden
    result = await db.execute(
        select(Class)
        .options(
            selectinload(Class.schedules),
            selectinload(Class.enrollments),
        )
        .where(Class.id == class_id)
    )
    class_ = result.scalar_one_or_none()
    
    if not class_:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Klasse nicht gefunden"
        )
    
    # Zugriffsberechtigung prüfen (Student muss eingeschrieben sein)
    if current_user.role == UserRole.STUDENT:
        is_enrolled = any(e.user_id == current_user.id for e in class_.enrollments)
        if not is_enrolled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Keine Berechtigung für diese Klasse"
            )
    
    # Kommende Sessions laden
    result = await db.execute(
        select(LiveSession)
        .where(LiveSession.class_id == class_id)
        .where(LiveSession.scheduled_at >= datetime.utcnow())
        .where(LiveSession.is_cancelled == False)
        .order_by(LiveSession.scheduled_at)
        .limit(5)
    )
    upcoming_sessions = result.scalars().all()
    
    # Response erstellen
    return ClassDetailResponse(
        id=str(class_.id),
        course_id=class_.course_id,
        name=class_.name,
        description=class_.description,
        start_date=class_.start_date,
        end_date=class_.end_date,
        max_students=class_.max_students,
        current_students=len([e for e in class_.enrollments if e.status.value == "active"]),
        is_active=class_.is_active,
        schedules=[
            ClassScheduleResponse(
                id=str(s.id),
                day_of_week=s.day_of_week,
                day_name=day_name(s.day_of_week),
                start_time=s.start_time.strftime("%H:%M"),
                end_time=s.end_time.strftime("%H:%M"),
                session_type=s.session_type.value,
                location=s.location,
            )
            for s in class_.schedules
        ],
        upcoming_sessions=[
            {
                "id": str(s.id),
                "title": s.title,
                "scheduled_at": s.scheduled_at.isoformat(),
                "duration_minutes": s.duration_minutes,
                "session_type": s.session_type.value,
            }
            for s in upcoming_sessions
        ]
    )


@router.get("/{class_id}/students", response_model=List[StudentResponse])
async def get_class_students(
    class_id: str,
    current_user: User = Depends(require_role(UserRole.TEACHER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Studenten einer Klasse abrufen (nur für Lehrer/Admin).
    """
    # Klasse laden
    result = await db.execute(
        select(Class)
        .options(selectinload(Class.enrollments).selectinload(ClassEnrollment.user))
        .where(Class.id == class_id)
    )
    class_ = result.scalar_one_or_none()
    
    if not class_:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Klasse nicht gefunden"
        )
    
    return [
        StudentResponse(
            id=str(e.user.id),
            first_name=e.user.first_name,
            last_name=e.user.last_name,
            email=e.user.email,
            enrollment_status=e.status.value,
            started_at=e.started_at,
        )
        for e in class_.enrollments
    ]


@router.get("/{class_id}/schedule", response_model=List[ClassScheduleResponse])
async def get_class_schedule(
    class_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Stundenplan einer Klasse abrufen.
    """
    result = await db.execute(
        select(ClassSchedule)
        .where(ClassSchedule.class_id == class_id)
        .order_by(ClassSchedule.day_of_week, ClassSchedule.start_time)
    )
    schedules = result.scalars().all()
    
    return [
        ClassScheduleResponse(
            id=str(s.id),
            day_of_week=s.day_of_week,
            day_name=day_name(s.day_of_week),
            start_time=s.start_time.strftime("%H:%M"),
            end_time=s.end_time.strftime("%H:%M"),
            session_type=s.session_type.value,
            location=s.location,
        )
        for s in schedules
    ]

