# ===========================================
# WARIZMY EDUCATION - Locations Router
# ===========================================
# Standorte für Kurse und Unterricht

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.content import Location

router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================
class LocationBase(BaseModel):
    """Basis-Schema für Location"""
    name: str
    slug: str
    description: Optional[str] = None
    street: Optional[str] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    country: str = "Deutschland"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    logo_url: Optional[str] = None
    image_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    parking_info: Optional[str] = None
    public_transport: Optional[str] = None
    accessibility: Optional[str] = None
    is_active: bool = True
    is_online: bool = False
    order: int = 0


class LocationCreate(LocationBase):
    """Schema für Location erstellen"""
    pass


class LocationUpdate(BaseModel):
    """Schema für Location aktualisieren"""
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    street: Optional[str] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    logo_url: Optional[str] = None
    image_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    parking_info: Optional[str] = None
    public_transport: Optional[str] = None
    accessibility: Optional[str] = None
    is_active: Optional[bool] = None
    is_online: Optional[bool] = None
    order: Optional[int] = None


class LocationResponse(LocationBase):
    """Schema für Location-Antwort"""
    id: str
    full_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# =========================================
# API Endpunkte - Öffentlich
# =========================================
@router.get("", response_model=List[LocationResponse])
async def get_locations(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    Alle Standorte abrufen.
    """
    query = select(Location).order_by(Location.order, Location.name)
    
    if active_only:
        query = query.where(Location.is_active == True)
    
    result = await db.execute(query)
    locations = result.scalars().all()
    
    return [
        LocationResponse(
            id=str(loc.id),
            name=loc.name,
            slug=loc.slug,
            description=loc.description,
            street=loc.street,
            zip_code=loc.zip_code,
            city=loc.city,
            country=loc.country,
            latitude=float(loc.latitude) if loc.latitude else None,
            longitude=float(loc.longitude) if loc.longitude else None,
            logo_url=loc.logo_url,
            image_url=loc.image_url,
            phone=loc.phone,
            email=loc.email,
            website=loc.website,
            parking_info=loc.parking_info,
            public_transport=loc.public_transport,
            accessibility=loc.accessibility,
            is_active=loc.is_active,
            is_online=loc.is_online,
            order=loc.order,
            full_address=loc.full_address,
            created_at=loc.created_at,
            updated_at=loc.updated_at,
        )
        for loc in locations
    ]


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Einzelnen Standort abrufen.
    """
    result = await db.execute(
        select(Location).where(Location.id == location_id)
    )
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standort nicht gefunden"
        )
    
    return LocationResponse(
        id=str(location.id),
        name=location.name,
        slug=location.slug,
        description=location.description,
        street=location.street,
        zip_code=location.zip_code,
        city=location.city,
        country=location.country,
        latitude=float(location.latitude) if location.latitude else None,
        longitude=float(location.longitude) if location.longitude else None,
        logo_url=location.logo_url,
        image_url=location.image_url,
        phone=location.phone,
        email=location.email,
        website=location.website,
        parking_info=location.parking_info,
        public_transport=location.public_transport,
        accessibility=location.accessibility,
        is_active=location.is_active,
        is_online=location.is_online,
        order=location.order,
        full_address=location.full_address,
        created_at=location.created_at,
        updated_at=location.updated_at,
    )


# =========================================
# API Endpunkte - Admin
# =========================================
@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: LocationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Neuen Standort erstellen.
    """
    # Prüfen ob Slug bereits existiert
    result = await db.execute(
        select(Location).where(Location.slug == location_data.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ein Standort mit diesem Slug existiert bereits"
        )
    
    location = Location(**location_data.model_dump())
    
    db.add(location)
    await db.commit()
    await db.refresh(location)
    
    return LocationResponse(
        id=str(location.id),
        name=location.name,
        slug=location.slug,
        description=location.description,
        street=location.street,
        zip_code=location.zip_code,
        city=location.city,
        country=location.country,
        latitude=float(location.latitude) if location.latitude else None,
        longitude=float(location.longitude) if location.longitude else None,
        logo_url=location.logo_url,
        image_url=location.image_url,
        phone=location.phone,
        email=location.email,
        website=location.website,
        parking_info=location.parking_info,
        public_transport=location.public_transport,
        accessibility=location.accessibility,
        is_active=location.is_active,
        is_online=location.is_online,
        order=location.order,
        full_address=location.full_address,
        created_at=location.created_at,
        updated_at=location.updated_at,
    )


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    location_data: LocationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Standort aktualisieren.
    """
    result = await db.execute(
        select(Location).where(Location.id == location_id)
    )
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standort nicht gefunden"
        )
    
    # Update fields
    update_data = location_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    
    await db.commit()
    await db.refresh(location)
    
    return LocationResponse(
        id=str(location.id),
        name=location.name,
        slug=location.slug,
        description=location.description,
        street=location.street,
        zip_code=location.zip_code,
        city=location.city,
        country=location.country,
        latitude=float(location.latitude) if location.latitude else None,
        longitude=float(location.longitude) if location.longitude else None,
        logo_url=location.logo_url,
        image_url=location.image_url,
        phone=location.phone,
        email=location.email,
        website=location.website,
        parking_info=location.parking_info,
        public_transport=location.public_transport,
        accessibility=location.accessibility,
        is_active=location.is_active,
        is_online=location.is_online,
        order=location.order,
        full_address=location.full_address,
        created_at=location.created_at,
        updated_at=location.updated_at,
    )


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Standort löschen.
    """
    result = await db.execute(
        select(Location).where(Location.id == location_id)
    )
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standort nicht gefunden"
        )
    
    await db.delete(location)
    await db.commit()

