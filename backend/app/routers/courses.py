# ===========================================
# WARIZMY EDUCATION - Courses Router
# ===========================================
# API-Endpunkte für Kurse und Lektionen

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
from datetime import datetime

from app.db.session import get_db
from app.models import (
    Course,
    CourseCategory,
    CourseLevel,
    CourseType,
    PriceType,
    Lesson,
    ContentType,
    TeacherProfile,
)

router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================

class LessonBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    order: int = 0
    # Content-Typ (video, text, pdf, mixed)
    content_type: str = "video"
    # Video
    vimeo_video_id: Optional[str] = None
    vimeo_video_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    # Text-Inhalt (Rich Text / HTML)
    text_content: Optional[str] = None
    # PDF
    pdf_url: Optional[str] = None
    pdf_name: Optional[str] = None
    # Materialien
    materials: Optional[List[dict]] = []
    # Quiz
    has_quiz: bool = False
    quiz_title: Optional[str] = None
    quiz_passing_score: int = 70
    quiz_questions: Optional[List[dict]] = []
    # Einstellungen
    is_free_preview: bool = False
    is_published: bool = False


class LessonCreate(LessonBase):
    course_id: UUID


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    # Content-Typ
    content_type: Optional[str] = None
    # Video
    vimeo_video_id: Optional[str] = None
    vimeo_video_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    # Text-Inhalt
    text_content: Optional[str] = None
    # PDF
    pdf_url: Optional[str] = None
    pdf_name: Optional[str] = None
    # Materialien
    materials: Optional[List[dict]] = None
    # Quiz
    has_quiz: Optional[bool] = None
    quiz_title: Optional[str] = None
    quiz_passing_score: Optional[int] = None
    quiz_questions: Optional[List[dict]] = None
    # Einstellungen
    is_free_preview: Optional[bool] = None
    is_published: Optional[bool] = None


class LessonResponse(LessonBase):
    id: UUID
    course_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeacherProfileResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    bio: Optional[str] = None
    qualifications: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    price: float = 0
    price_type: PriceType = PriceType.ONE_TIME
    subscription_price: Optional[float] = None
    course_type: CourseType = CourseType.COURSE
    category: CourseCategory
    level: CourseLevel = CourseLevel.BEGINNER
    book_affiliate_link: Optional[str] = None
    book_pdf_url: Optional[str] = None
    duration_weeks: Optional[int] = None
    max_students: Optional[int] = None
    order: int = 0
    is_active: bool = True
    is_featured: bool = False
    is_published: bool = False


class CourseCreate(CourseBase):
    teacher_ids: Optional[List[UUID]] = []


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    price: Optional[float] = None
    price_type: Optional[PriceType] = None
    subscription_price: Optional[float] = None
    course_type: Optional[CourseType] = None
    category: Optional[CourseCategory] = None
    level: Optional[CourseLevel] = None
    book_affiliate_link: Optional[str] = None
    book_pdf_url: Optional[str] = None
    duration_weeks: Optional[int] = None
    max_students: Optional[int] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    teacher_ids: Optional[List[UUID]] = None


class CourseResponse(CourseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    lesson_count: int = 0
    total_duration_minutes: int = 0
    teachers: List[TeacherProfileResponse] = []

    class Config:
        from_attributes = True


class CourseDetailResponse(CourseResponse):
    lessons: List[LessonResponse] = []


class CourseListResponse(BaseModel):
    items: List[CourseResponse]
    total: int
    page: int
    per_page: int


# =========================================
# Öffentliche Endpunkte (kein Login nötig)
# =========================================

@router.get("", response_model=CourseListResponse)
async def list_courses(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    category: Optional[CourseCategory] = None,
    level: Optional[CourseLevel] = None,
    course_type: Optional[CourseType] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Alle veröffentlichten Kurse auflisten.
    Unterstützt Filterung nach Kategorie, Level, Typ und Suchbegriff.
    """
    # Basis-Query: nur veröffentlichte und aktive Kurse
    query = select(Course).where(
        Course.is_published == True,
        Course.is_active == True
    ).options(
        selectinload(Course.teachers), 
        selectinload(Course.lessons)
    )
    
    # Filter anwenden
    if category:
        query = query.where(Course.category == category)
    if level:
        query = query.where(Course.level == level)
    if course_type:
        query = query.where(Course.course_type == course_type)
    if featured is not None:
        query = query.where(Course.is_featured == featured)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            Course.title.ilike(search_term) | 
            Course.short_description.ilike(search_term)
        )
    
    # Sortierung
    query = query.order_by(Course.order, Course.created_at.desc())
    
    # Gesamtanzahl ermitteln
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    return CourseListResponse(
        items=[CourseResponse.model_validate(c) for c in courses],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/featured", response_model=List[CourseResponse])
async def get_featured_courses(
    limit: int = Query(6, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Hervorgehobene Kurse für die Startseite."""
    query = select(Course).where(
        Course.is_published == True,
        Course.is_active == True,
        Course.is_featured == True
    ).options(
        selectinload(Course.teachers),
        selectinload(Course.lessons)
    ).order_by(Course.order).limit(limit)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    return [CourseResponse.model_validate(c) for c in courses]


@router.get("/{slug}", response_model=CourseDetailResponse)
async def get_course_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Einzelnen Kurs mit allen Lektionen abrufen."""
    query = select(Course).where(
        Course.slug == slug,
        Course.is_published == True,
        Course.is_active == True
    ).options(
        selectinload(Course.teachers),
        selectinload(Course.lessons)
    )
    
    result = await db.execute(query)
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    
    return CourseDetailResponse.model_validate(course)


@router.get("/{course_slug}/lessons/{lesson_slug}", response_model=LessonResponse)
async def get_lesson(
    course_slug: str,
    lesson_slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Einzelne Lektion abrufen."""
    # Erst Kurs finden
    course_query = select(Course).where(Course.slug == course_slug)
    course_result = await db.execute(course_query)
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    
    # Dann Lektion
    lesson_query = select(Lesson).where(
        Lesson.course_id == course.id,
        Lesson.slug == lesson_slug,
        Lesson.is_published == True
    )
    lesson_result = await db.execute(lesson_query)
    lesson = lesson_result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lektion nicht gefunden")
    
    return LessonResponse.model_validate(lesson)


# =========================================
# Admin-Endpunkte (für Kursverwaltung)
# =========================================

@router.get("/admin/all", response_model=CourseListResponse)
async def admin_list_all_courses(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Alle Kurse für Admin (inkl. nicht veröffentlichte).
    TODO: Admin-Authentifizierung hinzufügen.
    """
    query = select(Course).options(
        selectinload(Course.teachers),
        selectinload(Course.lessons)
    )
    query = query.order_by(Course.order, Course.created_at.desc())
    
    # Gesamtanzahl
    count_query = select(func.count()).select_from(Course)
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    return CourseListResponse(
        items=[CourseResponse.model_validate(c) for c in courses],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/admin/{course_id}", response_model=CourseDetailResponse)
async def admin_get_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Einzelnen Kurs für Admin abrufen (inkl. nicht veröffentlichte).
    TODO: Admin-Authentifizierung hinzufügen.
    """
    query = select(Course).where(Course.id == course_id).options(
        selectinload(Course.teachers),
        selectinload(Course.lessons)
    )
    
    result = await db.execute(query)
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    
    return CourseDetailResponse.model_validate(course)


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Neuen Kurs erstellen.
    TODO: Admin-Authentifizierung hinzufügen.
    """
    # Prüfen ob Slug bereits existiert
    existing = await db.execute(
        select(Course).where(Course.slug == course_data.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400, 
            detail="Ein Kurs mit diesem Slug existiert bereits"
        )
    
    # Kurs erstellen
    course = Course(
        title=course_data.title,
        slug=course_data.slug,
        description=course_data.description,
        short_description=course_data.short_description,
        thumbnail_url=course_data.thumbnail_url,
        preview_video_url=course_data.preview_video_url,
        price=course_data.price,
        price_type=course_data.price_type,
        subscription_price=course_data.subscription_price,
        course_type=course_data.course_type,
        category=course_data.category,
        level=course_data.level,
        book_affiliate_link=course_data.book_affiliate_link,
        book_pdf_url=course_data.book_pdf_url,
        duration_weeks=course_data.duration_weeks,
        max_students=course_data.max_students,
        order=course_data.order,
        is_active=course_data.is_active,
        is_featured=course_data.is_featured,
        is_published=course_data.is_published,
    )
    
    # Lehrer zuordnen
    if course_data.teacher_ids:
        teachers_result = await db.execute(
            select(TeacherProfile).where(TeacherProfile.id.in_(course_data.teacher_ids))
        )
        course.teachers = list(teachers_result.scalars().all())
    
    # Veröffentlichungsdatum setzen
    if course_data.is_published:
        course.published_at = datetime.utcnow()
    
    db.add(course)
    await db.commit()
    
    # Kurs mit allen Relationships neu laden
    result = await db.execute(
        select(Course)
        .where(Course.id == course.id)
        .options(selectinload(Course.teachers), selectinload(Course.lessons))
    )
    course = result.scalar_one()
    
    return CourseResponse.model_validate(course)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Kurs aktualisieren.
    TODO: Admin-Authentifizierung hinzufügen.
    """
    result = await db.execute(
        select(Course).where(Course.id == course_id).options(selectinload(Course.teachers))
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    
    # Felder aktualisieren
    update_data = course_data.model_dump(exclude_unset=True)
    
    # Lehrer separat behandeln
    teacher_ids = update_data.pop("teacher_ids", None)
    
    for field, value in update_data.items():
        setattr(course, field, value)
    
    # Lehrer aktualisieren
    if teacher_ids is not None:
        teachers_result = await db.execute(
            select(TeacherProfile).where(TeacherProfile.id.in_(teacher_ids))
        )
        course.teachers = list(teachers_result.scalars().all())
    
    # Veröffentlichungsdatum setzen
    if course_data.is_published and not course.published_at:
        course.published_at = datetime.utcnow()
    
    await db.commit()
    
    # Kurs mit allen Relationships neu laden
    result = await db.execute(
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.teachers), selectinload(Course.lessons))
    )
    course = result.scalar_one()
    
    return CourseResponse.model_validate(course)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Kurs löschen.
    TODO: Admin-Authentifizierung hinzufügen.
    """
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    
    await db.delete(course)
    await db.commit()


# =========================================
# Lektionen CRUD
# =========================================

@router.post("/{course_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    course_id: UUID,
    lesson_data: LessonBase,
    db: AsyncSession = Depends(get_db)
):
    """Neue Lektion erstellen."""
    # Kurs prüfen
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    
    lesson = Lesson(
        course_id=course_id,
        **lesson_data.model_dump()
    )
    
    db.add(lesson)
    await db.commit()

    # Lektion neu laden
    result = await db.execute(
        select(Lesson)
        .where(Lesson.id == lesson.id)
        
    )
    lesson = result.scalar_one()
    
    return LessonResponse.model_validate(lesson)


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: UUID,
    lesson_data: LessonUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Lektion aktualisieren."""
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lektion nicht gefunden")
    
    update_data = lesson_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)
    
    await db.commit()
    
    # Lektion mit allen Beziehungen neu laden
    result = await db.execute(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        
    )
    lesson = result.scalar_one()
    
    return LessonResponse.model_validate(lesson)


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Lektion löschen."""
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lektion nicht gefunden")
    
    await db.delete(lesson)
    await db.commit()
