# ===========================================
# WARIZMY EDUCATION - Location Model
# ===========================================
# Standorte für Kurse und Unterricht

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Location(Base):
    """
    Standort-Modell.
    
    Definiert einen physischen Ort für Präsenzunterricht.
    """
    __tablename__ = "locations"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Standort-ID (UUID)"
    )
    
    # =========================================
    # Basis-Informationen
    # =========================================
    name = Column(
        String(255), 
        nullable=False,
        comment="Name des Standorts (z.B. 'Islamisches Zentrum Berlin')"
    )
    slug = Column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True,
        comment="URL-Slug (eindeutig)"
    )
    description = Column(
        Text, 
        nullable=True,
        comment="Beschreibung des Standorts"
    )
    
    # =========================================
    # Adresse
    # =========================================
    street = Column(
        String(255), 
        nullable=True,
        comment="Straße und Hausnummer"
    )
    zip_code = Column(
        String(20), 
        nullable=True,
        comment="Postleitzahl"
    )
    city = Column(
        String(100), 
        nullable=True,
        comment="Stadt"
    )
    country = Column(
        String(100), 
        default="Deutschland",
        comment="Land"
    )
    
    # =========================================
    # Geo-Koordinaten (für Karte)
    # =========================================
    latitude = Column(
        Numeric(10, 8), 
        nullable=True,
        comment="Breitengrad"
    )
    longitude = Column(
        Numeric(11, 8), 
        nullable=True,
        comment="Längengrad"
    )
    
    # =========================================
    # Medien
    # =========================================
    logo_url = Column(
        String(500), 
        nullable=True,
        comment="Logo-URL"
    )
    image_url = Column(
        String(500), 
        nullable=True,
        comment="Bild-URL (Foto des Standorts)"
    )
    
    # =========================================
    # Kontakt
    # =========================================
    phone = Column(
        String(50), 
        nullable=True,
        comment="Telefonnummer"
    )
    email = Column(
        String(255), 
        nullable=True,
        comment="E-Mail-Adresse"
    )
    website = Column(
        String(500), 
        nullable=True,
        comment="Website-URL"
    )
    
    # =========================================
    # Zusatzinfos
    # =========================================
    parking_info = Column(
        Text, 
        nullable=True,
        comment="Parkplatz-Informationen"
    )
    public_transport = Column(
        Text, 
        nullable=True,
        comment="ÖPNV-Anbindung"
    )
    accessibility = Column(
        Text, 
        nullable=True,
        comment="Barrierefreiheit"
    )
    
    # =========================================
    # Status
    # =========================================
    is_active = Column(
        Boolean, 
        default=True,
        comment="Standort aktiv?"
    )
    is_online = Column(
        Boolean, 
        default=False,
        comment="Ist dies ein 'Online'-Standort?"
    )
    
    # =========================================
    # Sortierung
    # =========================================
    order = Column(
        Integer, 
        default=0,
        comment="Sortierreihenfolge"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Erstellt am"
    )
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        comment="Zuletzt aktualisiert"
    )
    
    # =========================================
    # Properties
    # =========================================
    @property
    def full_address(self) -> str:
        """Vollständige Adresse"""
        parts = [self.street, f"{self.zip_code} {self.city}".strip(), self.country]
        return ", ".join(p for p in parts if p)
    
    def __repr__(self) -> str:
        return f"<Location {self.name}>"

