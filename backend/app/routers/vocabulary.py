# ===========================================
# WARIZMY EDUCATION - Vocabulary Router
# ===========================================
# API-Endpunkte für Vokabelverwaltung (Arabisch-Deutsch)
# Sortierung: Wortart (Nomen/Verben/Partikel) → Unterkategorie

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
import re

from app.db.session import get_db
from app.models import (
    User,
    UserRole,
    VocabularyList,
    VocabularyItem,
    WordType,
    NounCategory,
    VerbCategory,
    ParticleCategory,
    VocabularyLevel,
    Course,
)
from app.routers.auth import get_current_user, require_role
from app.services.anthropic_vocabulary import (
    anthropic_vocabulary_service,
    GeneratedVocabulary,
    VocabularyVerification,
    VocabularyListSuggestion,
)

router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================

class VocabularyItemBase(BaseModel):
    """Basis-Schema für Vokabeln"""
    arabic: str = Field(..., min_length=1, description="Arabisches Wort")
    arabic_voweled: Optional[str] = None
    transliteration: Optional[str] = None
    german: str = Field(..., min_length=1, description="Deutsche Übersetzung")
    german_alternatives: Optional[List[str]] = None
    word_type: Optional[str] = None
    # Nomen-spezifisch
    gender: Optional[str] = None
    plural: Optional[str] = None
    plural_type: Optional[str] = None
    # Verb-spezifisch
    root: Optional[str] = None
    verb_form: Optional[str] = None
    past_tense: Optional[str] = None
    present_tense: Optional[str] = None
    imperative: Optional[str] = None
    masdar: Optional[str] = None
    # Beispiele
    example_arabic: Optional[str] = None
    example_german: Optional[str] = None
    # Medien
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None
    difficulty: int = Field(default=1, ge=1, le=5)


class VocabularyItemCreate(VocabularyItemBase):
    """Schema zum Erstellen einer Vokabel"""
    order: Optional[int] = 0


class VocabularyItemUpdate(BaseModel):
    """Schema zum Aktualisieren einer Vokabel"""
    arabic: Optional[str] = None
    arabic_voweled: Optional[str] = None
    transliteration: Optional[str] = None
    german: Optional[str] = None
    german_alternatives: Optional[List[str]] = None
    word_type: Optional[str] = None
    gender: Optional[str] = None
    plural: Optional[str] = None
    plural_type: Optional[str] = None
    root: Optional[str] = None
    verb_form: Optional[str] = None
    past_tense: Optional[str] = None
    present_tense: Optional[str] = None
    imperative: Optional[str] = None
    masdar: Optional[str] = None
    example_arabic: Optional[str] = None
    example_german: Optional[str] = None
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None
    difficulty: Optional[int] = None
    order: Optional[int] = None
    is_verified: Optional[bool] = None


class VocabularyItemResponse(VocabularyItemBase):
    """Schema für Vokabel-Antwort"""
    id: str
    vocabulary_list_id: str
    order: int
    is_verified: bool
    ai_confidence: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class VocabularyListBase(BaseModel):
    """Basis-Schema für Vokabellisten"""
    title: str = Field(..., min_length=1, max_length=255)
    title_arabic: Optional[str] = None
    description: Optional[str] = None
    word_type: WordType = WordType.NOUN
    noun_category: Optional[NounCategory] = None
    verb_category: Optional[VerbCategory] = None
    particle_category: Optional[ParticleCategory] = None
    level: VocabularyLevel = VocabularyLevel.A1
    tags: Optional[List[str]] = None
    course_id: Optional[str] = None


class VocabularyListCreate(VocabularyListBase):
    """Schema zum Erstellen einer Vokabelliste"""
    slug: Optional[str] = None


class VocabularyListUpdate(BaseModel):
    """Schema zum Aktualisieren einer Vokabelliste"""
    title: Optional[str] = None
    title_arabic: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    word_type: Optional[WordType] = None
    noun_category: Optional[NounCategory] = None
    verb_category: Optional[VerbCategory] = None
    particle_category: Optional[ParticleCategory] = None
    level: Optional[VocabularyLevel] = None
    tags: Optional[List[str]] = None
    course_id: Optional[str] = None
    order: Optional[int] = None
    is_published: Optional[bool] = None


class VocabularyListResponse(VocabularyListBase):
    """Schema für Vokabellisten-Antwort"""
    id: str
    slug: str
    order: int
    is_published: bool
    is_ai_generated: bool
    is_ai_verified: bool
    item_count: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    subcategory: Optional[str] = None
    
    class Config:
        from_attributes = True


class VocabularyListWithItems(VocabularyListResponse):
    """Vokabelliste mit allen Vokabeln"""
    items: List[VocabularyItemResponse] = []


# KI-Schemas
class AIGenerateRequest(BaseModel):
    """Anfrage für KI-Generierung"""
    topic: str = Field(..., description="Thema der Vokabelliste")
    word_type: WordType = WordType.NOUN
    subcategory: Optional[str] = None
    level: VocabularyLevel = VocabularyLevel.A1
    count: int = Field(default=20, ge=5, le=50, description="Anzahl der Vokabeln")
    additional_context: Optional[str] = None


class AIVerifyRequest(BaseModel):
    """Anfrage für KI-Überprüfung"""
    arabic: str
    german: str
    context: Optional[str] = None


class AIVerifyBatchRequest(BaseModel):
    """Anfrage für Batch-Überprüfung"""
    items: List[AIVerifyRequest]


class AIExampleRequest(BaseModel):
    """Anfrage für Beispielsätze"""
    arabic: str
    german: str
    level: VocabularyLevel = VocabularyLevel.A1
    count: int = Field(default=2, ge=1, le=5)


class AISuggestRequest(BaseModel):
    """Anfrage für Listen-Vorschläge"""
    course_topic: str
    level: VocabularyLevel = VocabularyLevel.A1
    count: int = Field(default=5, ge=1, le=10)


# =========================================
# Hilfsfunktionen
# =========================================

def generate_slug(title: str) -> str:
    """Generiert einen URL-freundlichen Slug aus dem Titel"""
    slug = title.lower()
    replacements = {
        'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
        ' ': '-', '_': '-'
    }
    for old, new in replacements.items():
        slug = slug.replace(old, new)
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


async def update_item_count(db: AsyncSession, vocabulary_list_id: UUID):
    """Aktualisiert die item_count für eine Vokabelliste"""
    result = await db.execute(
        select(func.count(VocabularyItem.id))
        .where(VocabularyItem.vocabulary_list_id == vocabulary_list_id)
    )
    count = result.scalar() or 0
    
    vocab_list = await db.get(VocabularyList, vocabulary_list_id)
    if vocab_list:
        vocab_list.item_count = count


def get_subcategory(vocab_list: VocabularyList) -> Optional[str]:
    """Gibt die aktive Unterkategorie zurück"""
    if vocab_list.word_type == WordType.NOUN and vocab_list.noun_category:
        return vocab_list.noun_category.value
    elif vocab_list.word_type == WordType.VERB and vocab_list.verb_category:
        return vocab_list.verb_category.value
    elif vocab_list.word_type == WordType.PARTICLE and vocab_list.particle_category:
        return vocab_list.particle_category.value
    return None


def vocab_list_to_response(vl: VocabularyList) -> VocabularyListResponse:
    """Konvertiert VocabularyList zu Response-Schema"""
    return VocabularyListResponse(
        id=str(vl.id),
        title=vl.title,
        title_arabic=vl.title_arabic,
        slug=vl.slug,
        description=vl.description,
        word_type=vl.word_type,
        noun_category=vl.noun_category,
        verb_category=vl.verb_category,
        particle_category=vl.particle_category,
        level=vl.level,
        tags=vl.tags or [],
        course_id=str(vl.course_id) if vl.course_id else None,
        order=vl.order,
        is_published=vl.is_published,
        is_ai_generated=vl.is_ai_generated,
        is_ai_verified=vl.is_ai_verified,
        item_count=vl.item_count,
        created_at=vl.created_at,
        updated_at=vl.updated_at,
        published_at=vl.published_at,
        subcategory=get_subcategory(vl),
    )


def vocab_item_to_response(item: VocabularyItem) -> VocabularyItemResponse:
    """Konvertiert VocabularyItem zu Response-Schema"""
    return VocabularyItemResponse(
        id=str(item.id),
        vocabulary_list_id=str(item.vocabulary_list_id),
        arabic=item.arabic,
        arabic_voweled=item.arabic_voweled,
        transliteration=item.transliteration,
        german=item.german,
        german_alternatives=item.german_alternatives or [],
        word_type=item.word_type,
        gender=item.gender,
        plural=item.plural,
        plural_type=item.plural_type,
        root=item.root,
        verb_form=item.verb_form,
        past_tense=item.past_tense,
        present_tense=item.present_tense,
        imperative=item.imperative,
        masdar=item.masdar,
        example_arabic=item.example_arabic,
        example_german=item.example_german,
        audio_url=item.audio_url,
        image_url=item.image_url,
        notes=item.notes,
        difficulty=item.difficulty,
        order=item.order,
        is_verified=item.is_verified,
        ai_confidence=item.ai_confidence,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


# =========================================
# Öffentliche Endpunkte
# =========================================

@router.get("/lists", response_model=List[VocabularyListResponse])
async def get_vocabulary_lists(
    db: AsyncSession = Depends(get_db),
    word_type: Optional[WordType] = None,
    noun_category: Optional[NounCategory] = None,
    verb_category: Optional[VerbCategory] = None,
    particle_category: Optional[ParticleCategory] = None,
    level: Optional[VocabularyLevel] = None,
    course_id: Optional[str] = None,
    published_only: bool = True,
    skip: int = 0,
    limit: int = 50
):
    """Alle Vokabellisten abrufen, gefiltert nach Wortart und Unterkategorie"""
    query = select(VocabularyList)
    
    if published_only:
        query = query.where(VocabularyList.is_published == True)
    
    if word_type:
        query = query.where(VocabularyList.word_type == word_type)
    
    if noun_category:
        query = query.where(VocabularyList.noun_category == noun_category)
    
    if verb_category:
        query = query.where(VocabularyList.verb_category == verb_category)
    
    if particle_category:
        query = query.where(VocabularyList.particle_category == particle_category)
    
    if level:
        query = query.where(VocabularyList.level == level)
    
    if course_id:
        query = query.where(VocabularyList.course_id == UUID(course_id))
    
    query = query.order_by(VocabularyList.word_type, VocabularyList.order, VocabularyList.created_at.desc())
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    lists = result.scalars().all()
    
    return [vocab_list_to_response(vl) for vl in lists]


@router.get("/lists/{list_id}", response_model=VocabularyListWithItems)
async def get_vocabulary_list(
    list_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Eine Vokabelliste mit allen Vokabeln abrufen"""
    result = await db.execute(
        select(VocabularyList)
        .options(selectinload(VocabularyList.items))
        .where(VocabularyList.id == UUID(list_id))
    )
    vocab_list = result.scalar_one_or_none()
    
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    response = vocab_list_to_response(vocab_list)
    return VocabularyListWithItems(
        **response.model_dump(),
        items=[vocab_item_to_response(item) for item in sorted(vocab_list.items, key=lambda x: x.order)]
    )


@router.get("/lists/slug/{slug}", response_model=VocabularyListWithItems)
async def get_vocabulary_list_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Eine Vokabelliste über den Slug abrufen"""
    result = await db.execute(
        select(VocabularyList)
        .options(selectinload(VocabularyList.items))
        .where(VocabularyList.slug == slug)
    )
    vocab_list = result.scalar_one_or_none()
    
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    return await get_vocabulary_list(str(vocab_list.id), db)


# =========================================
# Admin: Vokabellisten verwalten
# =========================================

@router.get("/admin/lists", response_model=List[VocabularyListResponse])
async def admin_get_all_lists(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
    word_type: Optional[WordType] = None,
    level: Optional[VocabularyLevel] = None,
    skip: int = 0,
    limit: int = 100
):
    """Alle Vokabellisten abrufen (auch unveröffentlichte)"""
    return await get_vocabulary_lists(
        db=db,
        word_type=word_type,
        level=level,
        published_only=False,
        skip=skip,
        limit=limit
    )


@router.post("/admin/lists", response_model=VocabularyListResponse, status_code=201)
async def create_vocabulary_list(
    data: VocabularyListCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Neue Vokabelliste erstellen"""
    slug = data.slug if data.slug else generate_slug(data.title)
    
    # Prüfen ob Slug bereits existiert
    result = await db.execute(
        select(VocabularyList).where(VocabularyList.slug == slug)
    )
    if result.scalar_one_or_none():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
    
    vocab_list = VocabularyList(
        title=data.title,
        title_arabic=data.title_arabic,
        slug=slug,
        description=data.description,
        word_type=data.word_type,
        noun_category=data.noun_category if data.word_type == WordType.NOUN else None,
        verb_category=data.verb_category if data.word_type == WordType.VERB else None,
        particle_category=data.particle_category if data.word_type == WordType.PARTICLE else None,
        level=data.level,
        tags=data.tags or [],
        course_id=UUID(data.course_id) if data.course_id else None,
    )
    
    db.add(vocab_list)
    await db.commit()
    await db.refresh(vocab_list)
    
    return vocab_list_to_response(vocab_list)


@router.put("/admin/lists/{list_id}", response_model=VocabularyListResponse)
async def update_vocabulary_list(
    list_id: str,
    data: VocabularyListUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Vokabelliste aktualisieren"""
    vocab_list = await db.get(VocabularyList, UUID(list_id))
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Wenn veröffentlicht wird, published_at setzen
    if update_data.get("is_published") and not vocab_list.is_published:
        update_data["published_at"] = datetime.utcnow()
    
    # course_id konvertieren
    if "course_id" in update_data:
        update_data["course_id"] = UUID(update_data["course_id"]) if update_data["course_id"] else None
    
    # Unterkategorien bereinigen bei Wortart-Wechsel
    if "word_type" in update_data:
        new_word_type = update_data["word_type"]
        if new_word_type != WordType.NOUN:
            update_data["noun_category"] = None
        if new_word_type != WordType.VERB:
            update_data["verb_category"] = None
        if new_word_type != WordType.PARTICLE:
            update_data["particle_category"] = None
    
    for key, value in update_data.items():
        setattr(vocab_list, key, value)
    
    await db.commit()
    await db.refresh(vocab_list)
    
    return vocab_list_to_response(vocab_list)


@router.delete("/admin/lists/{list_id}", status_code=204)
async def delete_vocabulary_list(
    list_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """Vokabelliste löschen (nur Admin)"""
    vocab_list = await db.get(VocabularyList, UUID(list_id))
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    await db.delete(vocab_list)
    await db.commit()


# =========================================
# Admin: Vokabeln verwalten
# =========================================

@router.post("/admin/lists/{list_id}/items", response_model=VocabularyItemResponse, status_code=201)
async def create_vocabulary_item(
    list_id: str,
    data: VocabularyItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Neue Vokabel hinzufügen"""
    vocab_list = await db.get(VocabularyList, UUID(list_id))
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    item = VocabularyItem(
        vocabulary_list_id=UUID(list_id),
        arabic=data.arabic,
        arabic_voweled=data.arabic_voweled,
        transliteration=data.transliteration,
        german=data.german,
        german_alternatives=data.german_alternatives or [],
        word_type=data.word_type,
        gender=data.gender,
        plural=data.plural,
        plural_type=data.plural_type,
        root=data.root,
        verb_form=data.verb_form,
        past_tense=data.past_tense,
        present_tense=data.present_tense,
        imperative=data.imperative,
        masdar=data.masdar,
        example_arabic=data.example_arabic,
        example_german=data.example_german,
        audio_url=data.audio_url,
        image_url=data.image_url,
        notes=data.notes,
        difficulty=data.difficulty,
        order=data.order or 0,
    )
    
    db.add(item)
    await db.commit()
    await db.refresh(item)
    
    await update_item_count(db, UUID(list_id))
    await db.commit()
    
    return vocab_item_to_response(item)


@router.post("/admin/lists/{list_id}/items/bulk", response_model=List[VocabularyItemResponse], status_code=201)
async def create_vocabulary_items_bulk(
    list_id: str,
    items: List[VocabularyItemCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Mehrere Vokabeln auf einmal hinzufügen"""
    vocab_list = await db.get(VocabularyList, UUID(list_id))
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    created_items = []
    for i, data in enumerate(items):
        item = VocabularyItem(
            vocabulary_list_id=UUID(list_id),
            arabic=data.arabic,
            arabic_voweled=data.arabic_voweled,
            transliteration=data.transliteration,
            german=data.german,
            german_alternatives=data.german_alternatives or [],
            word_type=data.word_type,
            gender=data.gender,
            plural=data.plural,
            plural_type=data.plural_type,
            root=data.root,
            verb_form=data.verb_form,
            past_tense=data.past_tense,
            present_tense=data.present_tense,
            imperative=data.imperative,
            masdar=data.masdar,
            example_arabic=data.example_arabic,
            example_german=data.example_german,
            audio_url=data.audio_url,
            image_url=data.image_url,
            notes=data.notes,
            difficulty=data.difficulty,
            order=data.order if data.order else i,
        )
        db.add(item)
        created_items.append(item)
    
    await db.commit()
    
    for item in created_items:
        await db.refresh(item)
    
    await update_item_count(db, UUID(list_id))
    await db.commit()
    
    return [vocab_item_to_response(item) for item in created_items]


@router.put("/admin/items/{item_id}", response_model=VocabularyItemResponse)
async def update_vocabulary_item(
    item_id: str,
    data: VocabularyItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Vokabel aktualisieren"""
    item = await db.get(VocabularyItem, UUID(item_id))
    if not item:
        raise HTTPException(status_code=404, detail="Vokabel nicht gefunden")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    await db.commit()
    await db.refresh(item)
    
    return vocab_item_to_response(item)


@router.delete("/admin/items/{item_id}", status_code=204)
async def delete_vocabulary_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Vokabel löschen"""
    item = await db.get(VocabularyItem, UUID(item_id))
    if not item:
        raise HTTPException(status_code=404, detail="Vokabel nicht gefunden")
    
    list_id = item.vocabulary_list_id
    await db.delete(item)
    await db.commit()
    
    await update_item_count(db, list_id)
    await db.commit()


# =========================================
# KI-Endpunkte
# =========================================

@router.post("/admin/ai/generate", response_model=List[VocabularyItemCreate])
async def ai_generate_vocabulary(
    data: AIGenerateRequest,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Vokabeln mit KI generieren"""
    try:
        # Kontext für die Generierung aufbauen
        context = f"Wortart: {data.word_type.value}"
        if data.subcategory:
            context += f", Unterkategorie: {data.subcategory}"
        
        generated = await anthropic_vocabulary_service.generate_vocabulary_list(
            topic=data.topic,
            category=data.subcategory or data.word_type.value,
            level=data.level.value,
            count=data.count,
            additional_context=f"{context}. {data.additional_context or ''}"
        )
        
        return [
            VocabularyItemCreate(
                arabic=item.arabic,
                arabic_voweled=item.arabic_voweled,
                transliteration=item.transliteration,
                german=item.german,
                german_alternatives=item.german_alternatives,
                word_type=item.word_type,
                gender=item.gender,
                plural=item.plural,
                root=item.root,
                example_arabic=item.example_arabic,
                example_german=item.example_german,
                notes=item.notes,
                difficulty=item.difficulty,
                order=i,
            )
            for i, item in enumerate(generated)
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler bei der KI-Generierung: {str(e)}"
        )


@router.post("/admin/ai/generate-to-list/{list_id}", response_model=VocabularyListWithItems)
async def ai_generate_and_save(
    list_id: str,
    data: AIGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Vokabeln mit KI generieren und direkt zur Liste hinzufügen"""
    vocab_list = await db.get(VocabularyList, UUID(list_id))
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    try:
        context = f"Wortart: {vocab_list.word_type.value}"
        subcategory = get_subcategory(vocab_list)
        if subcategory:
            context += f", Unterkategorie: {subcategory}"
        
        generated = await anthropic_vocabulary_service.generate_vocabulary_list(
            topic=data.topic,
            category=subcategory or vocab_list.word_type.value,
            level=vocab_list.level.value,
            count=data.count,
            additional_context=f"{context}. {data.additional_context or ''}"
        )
        
        # Höchste Order finden
        result = await db.execute(
            select(func.max(VocabularyItem.order))
            .where(VocabularyItem.vocabulary_list_id == UUID(list_id))
        )
        max_order = result.scalar() or -1
        
        # Vokabeln hinzufügen
        for i, item_data in enumerate(generated):
            item = VocabularyItem(
                vocabulary_list_id=UUID(list_id),
                arabic=item_data.arabic,
                arabic_voweled=item_data.arabic_voweled,
                transliteration=item_data.transliteration,
                german=item_data.german,
                german_alternatives=item_data.german_alternatives or [],
                word_type=item_data.word_type,
                gender=item_data.gender,
                plural=item_data.plural,
                root=item_data.root,
                example_arabic=item_data.example_arabic,
                example_german=item_data.example_german,
                notes=item_data.notes,
                difficulty=item_data.difficulty,
                order=max_order + 1 + i,
                is_verified=False,
            )
            db.add(item)
        
        vocab_list.is_ai_generated = True
        
        await db.commit()
        await update_item_count(db, UUID(list_id))
        await db.commit()
        
        return await get_vocabulary_list(list_id, db)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Fehler bei der KI-Generierung: {str(e)}"
        )


@router.post("/admin/ai/verify")
async def ai_verify_vocabulary(
    data: AIVerifyRequest,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Einzelne Vokabel mit KI überprüfen"""
    try:
        result = await anthropic_vocabulary_service.verify_vocabulary(
            arabic=data.arabic,
            german=data.german,
            context=data.context
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler bei der KI-Überprüfung: {str(e)}"
        )


@router.post("/admin/ai/verify-list/{list_id}")
async def ai_verify_list(
    list_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Alle Vokabeln einer Liste mit KI überprüfen"""
    result = await db.execute(
        select(VocabularyItem)
        .where(VocabularyItem.vocabulary_list_id == UUID(list_id))
        .order_by(VocabularyItem.order)
    )
    items = result.scalars().all()
    
    if not items:
        raise HTTPException(status_code=404, detail="Keine Vokabeln gefunden")
    
    try:
        items_to_verify = [
            {"arabic": item.arabic, "german": item.german}
            for item in items
        ]
        
        verifications = await anthropic_vocabulary_service.verify_vocabulary_list(items_to_verify)
        
        for item, verification in zip(items, verifications):
            item.is_verified = verification.is_correct
            item.ai_confidence = verification.confidence
            
            if verification.corrections:
                if "arabic" in verification.corrections:
                    item.arabic = verification.corrections["arabic"]
                if "german" in verification.corrections:
                    item.german = verification.corrections["german"]
        
        vocab_list = await db.get(VocabularyList, UUID(list_id))
        if vocab_list:
            vocab_list.is_ai_verified = True
        
        await db.commit()
        
        return {
            "verified_count": len(verifications),
            "correct_count": sum(1 for v in verifications if v.is_correct),
            "corrections_made": sum(1 for v in verifications if v.corrections),
            "results": [v.model_dump() for v in verifications]
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Fehler bei der KI-Überprüfung: {str(e)}"
        )


@router.post("/admin/ai/examples")
async def ai_generate_examples(
    data: AIExampleRequest,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Beispielsätze für eine Vokabel generieren"""
    try:
        examples = await anthropic_vocabulary_service.generate_example_sentences(
            arabic=data.arabic,
            german=data.german,
            level=data.level.value,
            count=data.count
        )
        return examples
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler bei der Beispielsatz-Generierung: {str(e)}"
        )


@router.post("/admin/ai/tashkil")
async def ai_add_tashkil(
    arabic_text: str = Query(..., description="Arabischer Text ohne Vokalzeichen"),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Vokalzeichen (Tashkil) zu arabischem Text hinzufügen"""
    try:
        result = await anthropic_vocabulary_service.add_tashkil(arabic_text)
        return {"original": arabic_text, "voweled": result}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Hinzufügen von Tashkil: {str(e)}"
        )


@router.post("/admin/ai/transliterate")
async def ai_transliterate(
    arabic_text: str = Query(..., description="Arabischer Text"),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER])),
):
    """Transliteration (lateinische Umschrift) für arabischen Text generieren"""
    try:
        result = await anthropic_vocabulary_service.generate_transliteration(arabic_text)
        return {"arabic": arabic_text, "transliteration": result}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler bei der Transliteration: {str(e)}"
        )


# =========================================
# Kategorien und Enums abrufen
# =========================================

@router.get("/word-types")
async def get_word_types():
    """Alle verfügbaren Wortarten abrufen"""
    return [
        {"value": "noun", "label": "Nomen", "arabic": "اسماء"},
        {"value": "verb", "label": "Verben", "arabic": "افعال"},
        {"value": "particle", "label": "Partikel", "arabic": "حروف"},
    ]


@router.get("/categories/nouns")
async def get_noun_categories():
    """Alle Nomen-Kategorien abrufen"""
    categories = {
        "general": ("Allgemein", "عام"),
        "food": ("Essen & Trinken", "طعام وشراب"),
        "school": ("Schule & Bildung", "مدرسة"),
        "work": ("Arbeit & Beruf", "عمل ومهنة"),
        "family": ("Familie", "عائلة"),
        "body": ("Körper", "جسم"),
        "clothes": ("Kleidung", "ملابس"),
        "house": ("Haus & Wohnung", "بيت ومنزل"),
        "nature": ("Natur", "طبيعة"),
        "animals": ("Tiere", "حيوانات"),
        "colors": ("Farben", "ألوان"),
        "numbers": ("Zahlen", "أرقام"),
        "time": ("Zeit & Datum", "وقت"),
        "weather": ("Wetter", "طقس"),
        "travel": ("Reisen", "سفر"),
        "health": ("Gesundheit", "صحة"),
        "religion": ("Religion & Islam", "دين"),
        "quran": ("Quran-Vokabeln", "قرآن"),
        "greetings": ("Begrüßungen", "تحيات"),
        "places": ("Orte", "أماكن"),
        "emotions": ("Gefühle", "مشاعر"),
        "technology": ("Technologie", "تكنولوجيا"),
    }
    return [
        {"value": k, "label": v[0], "arabic": v[1]}
        for k, v in categories.items()
    ]


@router.get("/categories/verbs")
async def get_verb_categories():
    """Alle Verben-Kategorien abrufen"""
    categories = {
        # Nach Stammform
        "three_letter": ("Dreistämmig (Form I)", "ثلاثي - فَعَلَ"),
        "four_letter": ("Vierstämmig", "رباعي"),
        "derived_ii": ("Form II - Intensiv", "فَعَّلَ"),
        "derived_iii": ("Form III - Reziprok", "فَاعَلَ"),
        "derived_iv": ("Form IV - Kausativ", "أَفْعَلَ"),
        "derived_v": ("Form V - Reflexiv", "تَفَعَّلَ"),
        "derived_vi": ("Form VI - Reziprok", "تَفَاعَلَ"),
        "derived_vii": ("Form VII - Passiv", "اِنْفَعَلَ"),
        "derived_viii": ("Form VIII - Reflexiv", "اِفْتَعَلَ"),
        "derived_x": ("Form X - Anforderung", "اِسْتَفْعَلَ"),
        # Nach Thema
        "daily": ("Alltag", "يومي"),
        "school_verbs": ("Schule & Lernen", "مدرسة"),
        "work_verbs": ("Arbeit & Beruf", "عمل"),
        "movement": ("Bewegung", "حركة"),
        "communication": ("Kommunikation", "تواصل"),
        "emotions_verbs": ("Gefühle", "مشاعر"),
        "cooking": ("Kochen", "طبخ"),
        "worship": ("Gottesdienst", "عبادة"),
        "general_verbs": ("Allgemein", "عام"),
    }
    return [
        {"value": k, "label": v[0], "arabic": v[1]}
        for k, v in categories.items()
    ]


@router.get("/categories/particles")
async def get_particle_categories():
    """Alle Partikel-Kategorien abrufen"""
    categories = {
        "prepositions": ("Präpositionen", "حروف الجر"),
        "conjunctions": ("Konjunktionen", "حروف العطف"),
        "negation": ("Verneinung", "حروف النفي"),
        "interrogative": ("Fragepartikel", "أدوات الاستفهام"),
        "conditional": ("Konditionalsätze", "أدوات الشرط"),
        "demonstrative": ("Demonstrativpronomen", "أسماء الإشارة"),
        "relative": ("Relativpronomen", "أسماء الموصولة"),
        "vocative": ("Vokativ (Anrede)", "أدوات النداء"),
        "exception": ("Ausnahme", "أدوات الاستثناء"),
        "emphasis": ("Betonung", "أدوات التوكيد"),
        "future": ("Futurpartikel", "أدوات المستقبل"),
        "general": ("Allgemein", "عام"),
    }
    return [
        {"value": k, "label": v[0], "arabic": v[1]}
        for k, v in categories.items()
    ]


@router.get("/levels")
async def get_levels():
    """Alle verfügbaren Sprachniveaus abrufen"""
    return [
        {"value": "a1", "label": "A1 - Anfänger"},
        {"value": "a2", "label": "A2 - Grundlagen"},
        {"value": "b1", "label": "B1 - Mittelstufe"},
        {"value": "b2", "label": "B2 - Fortgeschritten"},
        {"value": "c1", "label": "C1 - Experte"},
        {"value": "c2", "label": "C2 - Muttersprachlich"},
    ]
