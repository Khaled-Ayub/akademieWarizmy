# ===========================================
# WARIZMY EDUCATION - Admin Announcements Router
# ===========================================
# Admin-Endpunkte für Ankündigungsverwaltung

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import httpx
import json
import os

from app.db.session import get_db
from app.models import Announcement
from app.routers.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.services.ai_service import generate_announcement_text

router = APIRouter()

# =========================================
# Schemas
# =========================================
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    is_active: bool = True

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

class AISuggestionRequest(BaseModel):
    prompt: str
    language: str = "de"  # oder "ar"

# =========================================
# KI-Textgenerator
# =========================================
# Wird ersetzt durch den zentralen AI-Service

# =========================================
# API Endpunkte
# =========================================

@router.get("/announcements", response_model=List[AnnouncementResponse])
async def list_announcements(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Alle Ankündigungen auflisten (Admin)"""
    result = await db.execute(select(Announcement).order_by(Announcement.created_at.desc()))
    announcements = result.scalars().all()
    
    return [
        AnnouncementResponse(
            id=a.id,
            title=a.text.split('\n')[0] if '\n' in a.text else a.text[:50] + ('...' if len(a.text) > 50 else ''),
            content=a.text,
            is_active=a.is_active,
            created_at=a.created_at,
            updated_at=a.updated_at or a.created_at
        )
        for a in announcements
    ]

@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    data: AnnouncementCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Neue Ankündigung erstellen (Admin)"""
    announcement = Announcement(
        text=data.content,
        link_url=None,
        link_text="Mehr erfahren",
        is_active=data.is_active,
        priority=0
    )
    
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    
    return AnnouncementResponse(
        id=announcement.id,
        title=data.title,
        content=data.content,
        is_active=data.is_active,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at or announcement.created_at
    )

@router.patch("/announcements/{id}", response_model=AnnouncementResponse)
async def update_announcement(
    id: int,
    data: AnnouncementUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Ankündigung aktualisieren (Admin)"""
    result = await db.execute(select(Announcement).where(Announcement.id == id))
    announcement = result.scalar_one_or_none()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Ankündigung nicht gefunden")
    
    if data.content is not None:
        announcement.text = data.content
    if data.is_active is not None:
        announcement.is_active = data.is_active
    
    await db.commit()
    await db.refresh(announcement)
    
    return AnnouncementResponse(
        id=announcement.id,
        title=announcement.text.split('\n')[0] if '\n' in announcement.text else announcement.text[:50],
        content=announcement.text,
        is_active=announcement.is_active,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at or announcement.created_at
    )

@router.delete("/announcements/{id}")
async def delete_announcement(
    id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Ankündigung löschen (Admin)"""
    result = await db.execute(select(Announcement).where(Announcement.id == id))
    announcement = result.scalar_one_or_none()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Ankündigung nicht gefunden")
    
    await db.delete(announcement)
    await db.commit()
    
    return {"success": True, "message": "Ankündigung gelöscht"}

@router.post("/announcements/ai-suggest")
async def get_ai_suggestion(
    request: AISuggestionRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """KI-Vorschlag für Ankündigungstext generieren"""
    suggestion = await generate_announcement_text(request.prompt, request.language)
    
    return {
        "suggestion": suggestion,
        "language": request.language,
        "prompt_used": request.prompt
    }