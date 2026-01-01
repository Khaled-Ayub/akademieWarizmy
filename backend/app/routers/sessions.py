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

from app.database import get_db
from app.models.user import User, UserRole
from app.models.session import LiveSession, AttendanceConfirmation, Attendance, AttendanceStatus
from app.models.class_model import ClassEnrollment
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
# API Endpunkte
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

