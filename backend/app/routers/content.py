# ===========================================
# WARIZMY EDUCATION - Content Router
# ===========================================
# API-Endpunkte für Lehrer, FAQs, Testimonials, Ankündigungen

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models import (
    TeacherProfile,
    FAQ,
    Testimonial,
    Announcement,
    DailyGuidance,
    Weekday,
    RamadanMode,
)

router = APIRouter()


# =========================================
# Lehrer-Profile Schemas
# =========================================

class TeacherBase(BaseModel):
    name: str
    slug: str
    bio: Optional[str] = None
    qualifications: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    order: int = 0
    is_active: bool = True


class TeacherCreate(TeacherBase):
    user_id: Optional[UUID] = None


class TeacherResponse(TeacherBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================================
# FAQ Schemas
# =========================================

class FAQBase(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None
    order: int = 0
    is_published: bool = True


class FAQResponse(FAQBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# =========================================
# Testimonial Schemas
# =========================================

class TestimonialBase(BaseModel):
    name: str
    content: str
    rating: int = 5
    photo_url: Optional[str] = None
    is_featured: bool = False
    is_published: bool = True
    order: int = 0


class TestimonialCreate(TestimonialBase):
    course_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class TestimonialResponse(TestimonialBase):
    id: UUID
    course_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================================
# Announcement Schemas
# =========================================

class AnnouncementBase(BaseModel):
    text: str
    link_url: Optional[str] = None
    link_text: str = "Mehr erfahren"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True
    priority: int = 0


class AnnouncementResponse(AnnouncementBase):
    id: UUID
    created_at: datetime
    is_visible: bool

    class Config:
        from_attributes = True


# =========================================
# Daily Guidance Schemas
# =========================================

class DailyGuidanceBase(BaseModel):
    title: Optional[str] = None
    text: str
    link_url: Optional[str] = None
    link_text: str = "Mehr erfahren"
    weekday: Weekday = Weekday.EVERYDAY
    ramadan_mode: RamadanMode = RamadanMode.BOTH
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True
    priority: int = 0


class DailyGuidanceResponse(DailyGuidanceBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# =========================================
# Lehrer-Profile Endpunkte
# =========================================

@router.get("/teachers", response_model=List[TeacherResponse])
async def list_teachers(
    db: AsyncSession = Depends(get_db)
):
    """Alle aktiven Lehrer auflisten."""
    query = select(TeacherProfile).where(
        TeacherProfile.is_active == True
    ).order_by(TeacherProfile.order, TeacherProfile.name)
    
    result = await db.execute(query)
    teachers = result.scalars().all()
    return [TeacherResponse.model_validate(t) for t in teachers]


@router.get("/teachers/{slug}", response_model=TeacherResponse)
async def get_teacher(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Einzelnen Lehrer abrufen."""
    query = select(TeacherProfile).where(
        TeacherProfile.slug == slug,
        TeacherProfile.is_active == True
    )
    result = await db.execute(query)
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Lehrer nicht gefunden")
    
    return TeacherResponse.model_validate(teacher)


@router.post("/teachers", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    teacher_data: TeacherCreate,
    db: AsyncSession = Depends(get_db)
):
    """Neues Lehrer-Profil erstellen."""
    teacher = TeacherProfile(**teacher_data.model_dump())
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return TeacherResponse.model_validate(teacher)


@router.put("/teachers/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: UUID,
    teacher_data: TeacherBase,
    db: AsyncSession = Depends(get_db)
):
    """Lehrer-Profil aktualisieren."""
    result = await db.execute(select(TeacherProfile).where(TeacherProfile.id == teacher_id))
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Lehrer nicht gefunden")
    
    for field, value in teacher_data.model_dump().items():
        setattr(teacher, field, value)
    
    await db.commit()
    await db.refresh(teacher)
    return TeacherResponse.model_validate(teacher)


@router.delete("/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_teacher(
    teacher_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Lehrer-Profil löschen."""
    result = await db.execute(select(TeacherProfile).where(TeacherProfile.id == teacher_id))
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Lehrer nicht gefunden")
    
    await db.delete(teacher)
    await db.commit()


# =========================================
# FAQ Endpunkte
# =========================================

@router.get("/faqs", response_model=List[FAQResponse])
async def list_faqs(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Alle veröffentlichten FAQs auflisten."""
    query = select(FAQ).where(FAQ.is_published == True)
    
    if category:
        query = query.where(FAQ.category == category)
    
    query = query.order_by(FAQ.order, FAQ.created_at)
    
    result = await db.execute(query)
    faqs = result.scalars().all()
    return [FAQResponse.model_validate(f) for f in faqs]


@router.post("/faqs", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
async def create_faq(
    faq_data: FAQBase,
    db: AsyncSession = Depends(get_db)
):
    """Neue FAQ erstellen."""
    faq = FAQ(**faq_data.model_dump())
    db.add(faq)
    await db.commit()
    await db.refresh(faq)
    return FAQResponse.model_validate(faq)


@router.put("/faqs/{faq_id}", response_model=FAQResponse)
async def update_faq(
    faq_id: UUID,
    faq_data: FAQBase,
    db: AsyncSession = Depends(get_db)
):
    """FAQ aktualisieren."""
    result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
    faq = result.scalar_one_or_none()
    
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ nicht gefunden")
    
    for field, value in faq_data.model_dump().items():
        setattr(faq, field, value)
    
    await db.commit()
    await db.refresh(faq)
    return FAQResponse.model_validate(faq)


@router.delete("/faqs/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(
    faq_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """FAQ löschen."""
    result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
    faq = result.scalar_one_or_none()
    
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ nicht gefunden")
    
    await db.delete(faq)
    await db.commit()


# =========================================
# Testimonial Endpunkte
# =========================================

@router.get("/testimonials", response_model=List[TestimonialResponse])
async def list_testimonials(
    featured: Optional[bool] = None,
    course_id: Optional[UUID] = None,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Alle veröffentlichten Testimonials auflisten."""
    query = select(Testimonial).where(Testimonial.is_published == True)
    
    if featured is not None:
        query = query.where(Testimonial.is_featured == featured)
    if course_id:
        query = query.where(Testimonial.course_id == course_id)
    
    query = query.order_by(Testimonial.order, Testimonial.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    testimonials = result.scalars().all()
    return [TestimonialResponse.model_validate(t) for t in testimonials]


@router.post("/testimonials", response_model=TestimonialResponse, status_code=status.HTTP_201_CREATED)
async def create_testimonial(
    testimonial_data: TestimonialCreate,
    db: AsyncSession = Depends(get_db)
):
    """Neues Testimonial erstellen."""
    testimonial = Testimonial(**testimonial_data.model_dump())
    db.add(testimonial)
    await db.commit()
    await db.refresh(testimonial)
    return TestimonialResponse.model_validate(testimonial)


@router.delete("/testimonials/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testimonial(
    testimonial_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Testimonial löschen."""
    result = await db.execute(select(Testimonial).where(Testimonial.id == testimonial_id))
    testimonial = result.scalar_one_or_none()
    
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial nicht gefunden")
    
    await db.delete(testimonial)
    await db.commit()


# =========================================
# Announcement Endpunkte
# =========================================

@router.get("/announcements", response_model=List[AnnouncementResponse])
async def list_announcements(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Alle aktiven Ankündigungen auflisten."""
    query = select(Announcement)
    
    if active_only:
        query = query.where(Announcement.is_active == True)
    
    query = query.order_by(Announcement.priority.desc(), Announcement.created_at.desc())
    
    result = await db.execute(query)
    announcements = result.scalars().all()
    
    # Nur sichtbare zurückgeben
    if active_only:
        announcements = [a for a in announcements if a.is_visible]
    
    return [AnnouncementResponse.model_validate(a) for a in announcements]


@router.post("/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    announcement_data: AnnouncementBase,
    db: AsyncSession = Depends(get_db)
):
    """Neue Ankündigung erstellen."""
    announcement = Announcement(**announcement_data.model_dump())
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    return AnnouncementResponse.model_validate(announcement)


@router.delete("/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Ankündigung löschen."""
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    announcement = result.scalar_one_or_none()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Ankündigung nicht gefunden")
    
    await db.delete(announcement)
    await db.commit()


# =========================================
# Daily Guidance Endpunkte
# =========================================

@router.get("/daily-guidance", response_model=DailyGuidanceResponse)
async def get_todays_guidance(
    is_ramadan: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """Tageshinweis für heute abrufen."""
    import calendar
    
    # Aktueller Wochentag
    today = datetime.utcnow()
    weekday_map = {
        0: Weekday.MONDAY,
        1: Weekday.TUESDAY,
        2: Weekday.WEDNESDAY,
        3: Weekday.THURSDAY,
        4: Weekday.FRIDAY,
        5: Weekday.SATURDAY,
        6: Weekday.SUNDAY,
    }
    current_weekday = weekday_map[today.weekday()]
    
    # Query aufbauen
    query = select(DailyGuidance).where(
        DailyGuidance.is_active == True,
        (DailyGuidance.weekday == current_weekday) | (DailyGuidance.weekday == Weekday.EVERYDAY)
    )
    
    # Ramadan-Filter
    if is_ramadan:
        query = query.where(DailyGuidance.ramadan_mode.in_([RamadanMode.ONLY, RamadanMode.BOTH]))
    else:
        query = query.where(DailyGuidance.ramadan_mode.in_([RamadanMode.EXCLUDE, RamadanMode.BOTH]))
    
    # Datums-Filter
    query = query.where(
        (DailyGuidance.start_date == None) | (DailyGuidance.start_date <= today)
    ).where(
        (DailyGuidance.end_date == None) | (DailyGuidance.end_date >= today)
    )
    
    query = query.order_by(DailyGuidance.priority.desc()).limit(1)
    
    result = await db.execute(query)
    guidance = result.scalar_one_or_none()
    
    if not guidance:
        raise HTTPException(status_code=404, detail="Kein Tageshinweis verfügbar")
    
    return DailyGuidanceResponse.model_validate(guidance)


@router.get("/daily-guidance/all", response_model=List[DailyGuidanceResponse])
async def list_all_guidance(
    db: AsyncSession = Depends(get_db)
):
    """Alle Tageshinweise auflisten (Admin)."""
    query = select(DailyGuidance).order_by(DailyGuidance.weekday, DailyGuidance.priority.desc())
    result = await db.execute(query)
    guidances = result.scalars().all()
    return [DailyGuidanceResponse.model_validate(g) for g in guidances]


@router.post("/daily-guidance", response_model=DailyGuidanceResponse, status_code=status.HTTP_201_CREATED)
async def create_daily_guidance(
    guidance_data: DailyGuidanceBase,
    db: AsyncSession = Depends(get_db)
):
    """Neuen Tageshinweis erstellen."""
    guidance = DailyGuidance(**guidance_data.model_dump())
    db.add(guidance)
    await db.commit()
    await db.refresh(guidance)
    return DailyGuidanceResponse.model_validate(guidance)


@router.delete("/daily-guidance/{guidance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_guidance(
    guidance_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Tageshinweis löschen."""
    result = await db.execute(select(DailyGuidance).where(DailyGuidance.id == guidance_id))
    guidance = result.scalar_one_or_none()
    
    if not guidance:
        raise HTTPException(status_code=404, detail="Tageshinweis nicht gefunden")
    
    await db.delete(guidance)
    await db.commit()

