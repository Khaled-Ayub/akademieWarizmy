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

from app.db.session import get_db
from app.models import Announcement
from app.routers.auth import get_current_user, require_role
from app.models.user import User, UserRole

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
async def generate_text_with_ai(prompt: str, language: str = "de") -> str:
    """
    Generiert Text mit KI (OpenAI oder alternative APIs)
    """
    try:
        # OpenAI API-Key aus Umgebungsvariable
        api_key = "sk-proj-..."  # TODO: Aus .env laden
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # System-Prompt je nach Sprache
        system_prompt = {
            "de": "Du bist ein hilfreicher Assistent für eine islamische Bildungsplattform. Formuliere professionell und freundlich.",
            "ar": "أنت مساعد مفيد لمنصة تعليمية إسلامية. صيغ بلغة عربية فصيحة ومهذبة."
        }
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": system_prompt.get(language, system_prompt["de"])},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                # Fallback: einfache Vorlagen
                return await get_fallback_suggestion(prompt, language)
                
    except Exception as e:
        print(f"AI API Error: {e}")
        # Fallback-Vorschläge
        return await get_fallback_suggestion(prompt, language)

async def get_fallback_suggestion(prompt: str, language: str) -> str:
    """Fallback-Vorschläge wenn KI nicht verfügbar"""
    templates_de = {
        "maintenance": "⚠️ Wartungsarbeiten am Wochenende\n\nUnsere Plattform wird am [Datum] von [Uhrzeit] bis [Uhrzeit] wegen Wartungsarbeiten nicht erreichbar sein. Wir bitten um Ihr Verständnis.",
        "new_course": "🎓 Neuer Kurs verfügbar!\n\nWir freuen uns, unseren neuen Kurs '[Kursname]' anzukündigen. Startdatum: [Datum]. Jetzt anmelden!",
        "exam": "📝 Prüfungstermine veröffentlicht\n\nDie Prüfungstermine für den Kurs '[Kursname]' stehen fest. Bitte überprüfen Sie Ihren Bereich für Details.",
        "holiday": "🌙 Ramadan-Angebot\n\nWährend des Ramadan bieten wir spezielle Rabatte auf alle Kurse an. Nutzen Sie den Code RAMADAN2024 bis [Datum]."
    }
    
    templates_ar = {
        "maintenance": "⚠️ أعمال الصيانة في عطلة نهاية الأسبوع\n\nستكون منصتنا غير متاحة في [التاريخ] من [الوقت] حتى [الوقت] لأعمال الصيانة. نطلب منكم تفهمكم.",
        "new_course": "🎓 دورة جديدة متاحة!\n\nيسعدنا الإعلان عن دورتنا الجديدة '[اسم الدورة]'. تاريخ البدء: [التاريخ]. سجل الآن!",
        "exam": "📝 نُشرت مواعيد الامتحانات\n\nتم تحديد مواعيد امتحانات مادة '[اسم المادة]'. يرجى التحقق من قسمك للحصول على التفاصيل.",
        "holiday": "🌙 عرض رمضان\n\nخلال شهر رمضان، نقدم خصومات خاصة على جميع الدورات. استخدم الرمز RAMADAN2024 حتى [التاريخ]."
    }
    
    templates = templates_ar if language == "ar" else templates_de
    
    # Einfaches Matching
    prompt_lower = prompt.lower()
    if "wartung" in prompt_lower or "maintenance" in prompt_lower:
        return templates["maintenance"]
    elif "kurs" in prompt_lower or "course" in prompt_lower:
        return templates["new_course"]
    elif "prüfung" in prompt_lower or "exam" in prompt_lower:
        return templates["exam"]
    elif "ramadan" in prompt_lower or "عيد" in prompt_lower:
        return templates["holiday"]
    else:
        return templates["maintenance"]

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
    suggestion = await generate_text_with_ai(request.prompt, request.language)
    
    return {
        "suggestion": suggestion,
        "language": request.language,
        "prompt_used": request.prompt
    }