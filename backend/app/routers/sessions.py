# ===========================================
# WARIZMY EDUCATION - Sessions Router
# ===========================================
# Live-Sessions und Anwesenheits-Endpunkte

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.db.session import get_db
from app.models import (
    User,
    UserRole,
    LiveSession,
    AttendanceConfirmation,
    Attendance,
    AttendanceStatus,
    ClassEnrollment,
)
from app.routers.auth import get_current_user, require_role

router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================
class SessionResponse(BaseModel):
    """Schema für Session"""
    id: str
    class_id: str
    title: str
    description: Optional[str]
    session_type: str
    location: Optional[str]
    scheduled_at: datetime
    duration_minutes: int
    zoom_join_url: Optional[str]
    vimeo_video_url: Optional[str]
    is_cancelled: bool
    cancel_reason: Optional[str]
    my_confirmation: Optional[dict] = None
    
    class Config:
        from_attributes = True


class ConfirmationCreate(BaseModel):
    """Schema für Teilnahmebestätigung"""
    will_attend: bool
    absence_reason: Optional[str] = None


class ConfirmationResponse(BaseModel):
    """Schema für Bestätigungs-Antwort"""
    id: str
    user_id: str
    live_session_id: str
    will_attend: bool
    absence_reason: Optional[str]
    confirmed_at: datetime
    
    class Config:
        from_attributes = True


# =========================================
# API Endpunkte - Öffentlich (für Startseite)
# =========================================
@router.get("/public")
async def get_public_sessions(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Öffentliche Sessions für Stundenplan auf Startseite.
    Zeigt:
    1. Konkrete LiveSessions (bereits erstellt)
    2. Virtuelle Sessions aus ClassSchedules (wiederkehrende Termine)
    """
    from app.models import Course, Class, ClassSchedule
    
    # Parse Datumsfilter
    now = datetime.utcnow()
    start = datetime.fromisoformat(from_date) if from_date else now
    end = datetime.fromisoformat(to_date + "T23:59:59") if to_date else (now + timedelta(days=30))
    
    result_sessions = []
    
    # 1. Konkrete LiveSessions laden
    query = select(LiveSession).options(
        selectinload(LiveSession.class_),
        selectinload(LiveSession.course),
    ).where(LiveSession.is_cancelled == False)
    
    query = query.where(LiveSession.scheduled_at >= start)
    query = query.where(LiveSession.scheduled_at <= end)
    query = query.order_by(LiveSession.scheduled_at).limit(50)
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    for s in sessions:
        result_sessions.append({
            "id": str(s.id),
            "title": s.title,
            "date": s.scheduled_at.strftime("%Y-%m-%d"),
            "start_time": s.scheduled_at.strftime("%H:%M:%S"),
            "end_time": (s.scheduled_at + timedelta(minutes=s.duration_minutes)).strftime("%H:%M:%S"),
            "type": s.session_type.value,
            "location": s.location,
            "zoom_link": s.zoom_join_url,
            "description": s.description,
            "color": "primary",
            "course": {
                "id": str(s.course_id) if s.course_id else None,
                "title": s.course.title if s.course else None,
                "slug": s.course.slug if s.course else None,
            } if s.course_id else None,
            "teacher": None,
        })
    
    # 2. Virtuelle Sessions aus ClassSchedules generieren
    # Lade alle aktiven Klassen mit Schedules
    query = select(Class).options(
        selectinload(Class.schedules),
        selectinload(Class.course),
    ).where(Class.is_active == True)
    
    result = await db.execute(query)
    classes = result.scalars().all()
    
    # Für jeden Schedule virtuelle Termine generieren
    for cls in classes:
        if not cls.schedules:
            continue
            
        for schedule in cls.schedules:
            # Generiere Termine für den Zeitraum
            current = start
            while current <= end:
                # Finde den nächsten passenden Wochentag
                days_ahead = schedule.day_of_week - current.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                
                session_date = current + timedelta(days=days_ahead)
                
                # Prüfe ob im Zeitraum
                if session_date > end:
                    break
                    
                # Kombiniere Datum und Zeit
                session_datetime = datetime.combine(
                    session_date.date(),
                    schedule.start_time
                )
                
                # Nur zukünftige Termine
                if session_datetime >= start and session_datetime <= end:
                    # Prüfe ob bereits eine LiveSession existiert (vermeiden Duplikate)
                    existing = any(
                        s["date"] == session_date.strftime("%Y-%m-%d") and
                        s["start_time"] == schedule.start_time.strftime("%H:%M:%S")
                        for s in result_sessions
                    )
                    
                    if not existing:
                        # Farbe basierend auf Kurstyp
                        color = "primary"
                        if cls.course and cls.course.category:
                            color = "purple" if cls.course.category.value == "islamic" else "primary"
                        
                        result_sessions.append({
                            "id": f"schedule-{schedule.id}-{session_date.strftime('%Y%m%d')}",
                            "title": cls.name,
                            "date": session_date.strftime("%Y-%m-%d"),
                            "start_time": schedule.start_time.strftime("%H:%M:%S"),
                            "end_time": schedule.end_time.strftime("%H:%M:%S"),
                            "type": schedule.session_type.value,
                            "location": schedule.location,
                            "zoom_link": schedule.zoom_join_url,
                            "description": cls.description,
                            "color": color,
                            "course": {
                                "id": str(cls.course_id) if cls.course_id else None,
                                "title": cls.course.title if cls.course else None,
                                "slug": cls.course.slug if cls.course else None,
                            } if cls.course else None,
                            "teacher": None,
                        })
                
                # Nächste Woche
                current = session_date + timedelta(days=1)
    
    # Nach Datum und Zeit sortieren
    result_sessions.sort(key=lambda x: (x["date"], x["start_time"]))
    
    return result_sessions[:50]  # Limit auf 50


# =========================================
# API Endpunkte - Authentifiziert
# =========================================
@router.get("/", response_model=List[SessionResponse])
async def get_my_sessions(
    upcoming_only: bool = True,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meine Sessions abrufen (Klassen, in denen ich eingeschrieben bin).
    """
    # Meine Klassen-IDs finden
    result = await db.execute(
        select(ClassEnrollment.class_id)
        .where(ClassEnrollment.user_id == current_user.id)
    )
    class_ids = [row[0] for row in result.all()]
    
    if not class_ids:
        return []
    
    # Sessions laden
    query = select(LiveSession).where(LiveSession.class_id.in_(class_ids))
    
    if upcoming_only:
        query = query.where(LiveSession.scheduled_at >= datetime.utcnow())
        query = query.where(LiveSession.is_cancelled == False)
    
    query = query.order_by(LiveSession.scheduled_at).limit(limit)
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    # Meine Bestätigungen laden
    session_ids = [s.id for s in sessions]
    result = await db.execute(
        select(AttendanceConfirmation)
        .where(AttendanceConfirmation.user_id == current_user.id)
        .where(AttendanceConfirmation.live_session_id.in_(session_ids))
    )
    confirmations = {c.live_session_id: c for c in result.scalars().all()}
    
    return [
        SessionResponse(
            id=str(s.id),
            class_id=str(s.class_id),
            title=s.title,
            description=s.description,
            session_type=s.session_type.value,
            location=s.location,
            scheduled_at=s.scheduled_at,
            duration_minutes=s.duration_minutes,
            zoom_join_url=s.zoom_join_url,
            vimeo_video_url=s.vimeo_video_url,
            is_cancelled=s.is_cancelled,
            cancel_reason=s.cancel_reason,
            my_confirmation={
                "will_attend": confirmations[s.id].will_attend,
                "absence_reason": confirmations[s.id].absence_reason,
                "confirmed_at": confirmations[s.id].confirmed_at.isoformat(),
            } if s.id in confirmations else None
        )
        for s in sessions
    ]


@router.get("/upcoming")
async def get_upcoming_sessions(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sessions der nächsten X Tage abrufen (für Dashboard-Widget).
    """
    # Meine Klassen-IDs finden
    result = await db.execute(
        select(ClassEnrollment.class_id)
        .where(ClassEnrollment.user_id == current_user.id)
    )
    class_ids = [row[0] for row in result.all()]
    
    if not class_ids:
        return {"sessions": [], "requires_confirmation": []}
    
    now = datetime.utcnow()
    end_date = now + timedelta(days=days)
    
    # Sessions laden
    result = await db.execute(
        select(LiveSession)
        .where(LiveSession.class_id.in_(class_ids))
        .where(LiveSession.scheduled_at >= now)
        .where(LiveSession.scheduled_at <= end_date)
        .where(LiveSession.is_cancelled == False)
        .order_by(LiveSession.scheduled_at)
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
    
    # Sessions die noch Bestätigung brauchen
    requires_confirmation = [
        {
            "id": str(s.id),
            "title": s.title,
            "scheduled_at": s.scheduled_at.isoformat(),
        }
        for s in sessions
        if s.id not in confirmations
    ]
    
    return {
        "sessions": [
            {
                "id": str(s.id),
                "title": s.title,
                "scheduled_at": s.scheduled_at.isoformat(),
                "session_type": s.session_type.value,
                "confirmed": s.id in confirmations,
                "will_attend": confirmations[s.id].will_attend if s.id in confirmations else None,
            }
            for s in sessions
        ],
        "requires_confirmation": requires_confirmation,
    }


@router.get("/unconfirmed")
async def get_unconfirmed_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sessions ohne Bestätigung für den aktuellen Benutzer abrufen.
    Zeigt nur zukünftige Sessions in den nächsten 14 Tagen.
    """
    # Meine Klassen-IDs finden
    result = await db.execute(
        select(ClassEnrollment.class_id)
        .where(ClassEnrollment.user_id == current_user.id)
    )
    class_ids = [row[0] for row in result.all()]
    
    if not class_ids:
        return {"unconfirmed": []}
    
    now = datetime.utcnow()
    end_date = now + timedelta(days=14)
    
    # Sessions laden
    result = await db.execute(
        select(LiveSession)
        .options(selectinload(LiveSession.class_))
        .where(LiveSession.class_id.in_(class_ids))
        .where(LiveSession.scheduled_at >= now)
        .where(LiveSession.scheduled_at <= end_date)
        .where(LiveSession.is_cancelled == False)
        .order_by(LiveSession.scheduled_at)
    )
    sessions = result.scalars().all()
    
    # Meine Bestätigungen laden
    session_ids = [s.id for s in sessions]
    result = await db.execute(
        select(AttendanceConfirmation.live_session_id)
        .where(AttendanceConfirmation.user_id == current_user.id)
        .where(AttendanceConfirmation.live_session_id.in_(session_ids))
    )
    confirmed_ids = {row[0] for row in result.all()}
    
    # Unbestätigte Sessions filtern
    unconfirmed = []
    for s in sessions:
        if s.id not in confirmed_ids:
            # Tage bis zur Session berechnen
            days_until = (s.scheduled_at.date() - now.date()).days
            
            unconfirmed.append({
                "id": str(s.id),
                "title": s.title,
                "class_name": s.class_.name if s.class_ else None,
                "scheduled_at": s.scheduled_at.isoformat(),
                "date": s.scheduled_at.strftime("%Y-%m-%d"),
                "time": s.scheduled_at.strftime("%H:%M"),
                "session_type": s.session_type.value,
                "location": s.location,
                "days_until": days_until,
                "is_today": days_until == 0,
                "is_tomorrow": days_until == 1,
                "is_urgent": days_until <= 2,
            })
    
    return {
        "unconfirmed": unconfirmed,
        "total_count": len(unconfirmed),
        "urgent_count": sum(1 for s in unconfirmed if s["is_urgent"]),
    }


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Session Details abrufen.
    """
    result = await db.execute(
        select(LiveSession).where(LiveSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session nicht gefunden"
        )
    
    # Meine Bestätigung laden
    result = await db.execute(
        select(AttendanceConfirmation)
        .where(AttendanceConfirmation.user_id == current_user.id)
        .where(AttendanceConfirmation.live_session_id == session_id)
    )
    confirmation = result.scalar_one_or_none()
    
    return SessionResponse(
        id=str(session.id),
        class_id=str(session.class_id),
        title=session.title,
        description=session.description,
        session_type=session.session_type.value,
        location=session.location,
        scheduled_at=session.scheduled_at,
        duration_minutes=session.duration_minutes,
        zoom_join_url=session.zoom_join_url,
        vimeo_video_url=session.vimeo_video_url,
        is_cancelled=session.is_cancelled,
        cancel_reason=session.cancel_reason,
        my_confirmation={
            "will_attend": confirmation.will_attend,
            "absence_reason": confirmation.absence_reason,
            "confirmed_at": confirmation.confirmed_at.isoformat(),
        } if confirmation else None
    )


@router.post("/{session_id}/confirm", response_model=ConfirmationResponse)
async def confirm_attendance(
    session_id: str,
    data: ConfirmationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Teilnahme bestätigen (Ja/Nein + optionaler Grund).
    """
    # Session prüfen
    result = await db.execute(
        select(LiveSession).where(LiveSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session nicht gefunden"
        )
    
    if session.is_cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session wurde abgesagt"
        )
    
    # Existierende Bestätigung suchen oder neue erstellen
    result = await db.execute(
        select(AttendanceConfirmation)
        .where(AttendanceConfirmation.user_id == current_user.id)
        .where(AttendanceConfirmation.live_session_id == session_id)
    )
    confirmation = result.scalar_one_or_none()
    
    if confirmation:
        # Bestätigung aktualisieren
        confirmation.will_attend = data.will_attend
        confirmation.absence_reason = data.absence_reason
        confirmation.confirmed_at = datetime.utcnow()
    else:
        # Neue Bestätigung erstellen
        confirmation = AttendanceConfirmation(
            user_id=current_user.id,
            live_session_id=session_id,
            will_attend=data.will_attend,
            absence_reason=data.absence_reason,
        )
        db.add(confirmation)
    
    await db.commit()
    await db.refresh(confirmation)
    
    return ConfirmationResponse(
        id=str(confirmation.id),
        user_id=str(confirmation.user_id),
        live_session_id=str(confirmation.live_session_id),
        will_attend=confirmation.will_attend,
        absence_reason=confirmation.absence_reason,
        confirmed_at=confirmation.confirmed_at,
    )


@router.get("/{session_id}/my-confirmation")
async def get_my_confirmation(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meine Teilnahmebestätigung abrufen.
    """
    result = await db.execute(
        select(AttendanceConfirmation)
        .where(AttendanceConfirmation.user_id == current_user.id)
        .where(AttendanceConfirmation.live_session_id == session_id)
    )
    confirmation = result.scalar_one_or_none()
    
    if not confirmation:
        return {"confirmed": False}
    
    return {
        "confirmed": True,
        "will_attend": confirmation.will_attend,
        "absence_reason": confirmation.absence_reason,
        "confirmed_at": confirmation.confirmed_at.isoformat(),
    }


@router.post("/{session_id}/join")
async def join_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Zoom-Link für Session erhalten.
    """
    result = await db.execute(
        select(LiveSession).where(LiveSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session nicht gefunden"
        )
    
    if session.is_cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session wurde abgesagt"
        )
    
    if not session.zoom_join_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kein Zoom-Link verfügbar"
        )
    
    return {
        "zoom_join_url": session.zoom_join_url,
        "zoom_password": session.zoom_password,
    }


# =========================================
# Lehrer-Endpunkte für Anwesenheitserfassung
# =========================================
class StudentAttendanceUpdate(BaseModel):
    """Schema für Anwesenheits-Update eines einzelnen Studenten"""
    user_id: str
    status: str  # present, absent_excused, absent_unexcused
    notes: Optional[str] = None


class BulkAttendanceUpdate(BaseModel):
    """Schema für Massen-Anwesenheits-Update"""
    attendances: List[StudentAttendanceUpdate]


@router.get("/{session_id}/attendance")
async def get_session_attendance(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Anwesenheitsliste einer Session abrufen (für Lehrer).
    Zeigt alle Studenten der Klasse mit ihrem Bestätigungs- und Anwesenheitsstatus.
    """
    from app.models import Class, ClassTeacher, LiveSessionType
    
    # Nur Lehrer und Admins
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Lehrer und Admins können Anwesenheit einsehen"
        )
    
    # Session laden
    result = await db.execute(
        select(LiveSession)
        .options(selectinload(LiveSession.class_))
        .where(LiveSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session nicht gefunden"
        )
    
    # Prüfen ob User Lehrer dieser Klasse ist (außer Admin)
    if current_user.role == UserRole.TEACHER:
        result = await db.execute(
            select(ClassTeacher)
            .where(ClassTeacher.class_id == session.class_id)
            .where(ClassTeacher.teacher_id == current_user.id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sie sind nicht Lehrer dieser Klasse"
            )
    
    # Alle Studenten der Klasse laden
    result = await db.execute(
        select(ClassEnrollment)
        .options(selectinload(ClassEnrollment.user))
        .where(ClassEnrollment.class_id == session.class_id)
    )
    enrollments = result.scalars().all()
    
    # Bestätigungen laden
    result = await db.execute(
        select(AttendanceConfirmation)
        .where(AttendanceConfirmation.live_session_id == session_id)
    )
    confirmations = {c.user_id: c for c in result.scalars().all()}
    
    # Anwesenheiten laden
    result = await db.execute(
        select(Attendance)
        .where(Attendance.live_session_id == session_id)
    )
    attendances = {a.user_id: a for a in result.scalars().all()}
    
    # Studenten-Liste aufbauen
    students = []
    for enrollment in enrollments:
        user = enrollment.user
        confirmation = confirmations.get(user.id)
        attendance = attendances.get(user.id)
        
        students.append({
            "user_id": str(user.id),
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email,
            # Vorab-Bestätigung durch Schüler
            "confirmation": {
                "confirmed": confirmation is not None,
                "will_attend": confirmation.will_attend if confirmation else None,
                "absence_reason": confirmation.absence_reason if confirmation else None,
                "confirmed_at": confirmation.confirmed_at.isoformat() if confirmation else None,
            },
            # Tatsächliche Anwesenheit (vom Lehrer erfasst)
            "attendance": {
                "recorded": attendance is not None,
                "status": attendance.status.value if attendance else None,
                "notes": attendance.notes if attendance else None,
                "checked_in_at": attendance.checked_in_at.isoformat() if attendance and attendance.checked_in_at else None,
            },
        })
    
    return {
        "session": {
            "id": str(session.id),
            "title": session.title,
            "scheduled_at": session.scheduled_at.isoformat(),
            "session_type": session.session_type.value,
            "class_name": session.class_.name if session.class_ else None,
            "is_past": session.scheduled_at < datetime.utcnow(),
        },
        "students": students,
        "summary": {
            "total": len(students),
            "confirmed_yes": sum(1 for s in students if s["confirmation"]["will_attend"] == True),
            "confirmed_no": sum(1 for s in students if s["confirmation"]["will_attend"] == False),
            "not_confirmed": sum(1 for s in students if not s["confirmation"]["confirmed"]),
            "present": sum(1 for s in students if s["attendance"]["status"] == "present"),
            "absent_excused": sum(1 for s in students if s["attendance"]["status"] == "absent_excused"),
            "absent_unexcused": sum(1 for s in students if s["attendance"]["status"] == "absent_unexcused"),
            "not_recorded": sum(1 for s in students if not s["attendance"]["recorded"]),
        },
    }


@router.post("/{session_id}/attendance")
async def update_session_attendance(
    session_id: str,
    data: BulkAttendanceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Anwesenheit für mehrere Studenten erfassen/aktualisieren (für Lehrer).
    """
    from app.models import ClassTeacher, LiveSessionType, CheckInMethod
    
    # Nur Lehrer und Admins
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Lehrer und Admins können Anwesenheit erfassen"
        )
    
    # Session laden
    result = await db.execute(
        select(LiveSession).where(LiveSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session nicht gefunden"
        )
    
    # Prüfen ob User Lehrer dieser Klasse ist (außer Admin)
    if current_user.role == UserRole.TEACHER:
        result = await db.execute(
            select(ClassTeacher)
            .where(ClassTeacher.class_id == session.class_id)
            .where(ClassTeacher.teacher_id == current_user.id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sie sind nicht Lehrer dieser Klasse"
            )
    
    # Status-Mapping
    status_map = {
        "present": AttendanceStatus.PRESENT,
        "absent_excused": AttendanceStatus.ABSENT_EXCUSED,
        "absent_unexcused": AttendanceStatus.ABSENT_UNEXCUSED,
    }
    
    updated = 0
    created = 0
    
    for att in data.attendances:
        if att.status not in status_map:
            continue
        
        # Bestehende Anwesenheit suchen
        result = await db.execute(
            select(Attendance)
            .where(Attendance.user_id == att.user_id)
            .where(Attendance.live_session_id == session_id)
        )
        attendance = result.scalar_one_or_none()
        
        if attendance:
            # Aktualisieren
            attendance.status = status_map[att.status]
            attendance.notes = att.notes
            attendance.updated_at = datetime.utcnow()
            updated += 1
        else:
            # Neu erstellen
            attendance = Attendance(
                user_id=att.user_id,
                live_session_id=session_id,
                attendance_type=session.session_type,
                status=status_map[att.status],
                notes=att.notes,
                checked_in_at=datetime.utcnow(),
                checked_in_by=CheckInMethod.MANUAL,
            )
            db.add(attendance)
            created += 1
    
    await db.commit()
    
    return {
        "success": True,
        "updated": updated,
        "created": created,
        "message": f"Anwesenheit erfolgreich gespeichert ({created} neu, {updated} aktualisiert)",
    }

