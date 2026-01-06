# ===========================================
# WARIZMY EDUCATION - Announcement Model
# ===========================================
# Ankündigungen für das Banner

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Announcement(Base):
    """
    Ankündigung-Modell.
    
    Ankündigungen für das Laufband-Banner auf der Website.
    """
    __tablename__ = "announcements"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Ankündigungs-ID (UUID)"
    )
    
    # =========================================
    # Inhalt
    # =========================================
    text = Column(
        String(500), 
        nullable=False,
        comment="Ankündigungstext"
    )
    link_url = Column(
        String(500), 
        nullable=True,
        comment="Link-URL (optional)"
    )
    link_text = Column(
        String(100), 
        default="Mehr erfahren",
        comment="Link-Text"
    )
    
    # =========================================
    # Zeitliche Steuerung
    # =========================================
    start_date = Column(
        DateTime, 
        nullable=True,
        comment="Startdatum (optional)"
    )
    end_date = Column(
        DateTime, 
        nullable=True,
        comment="Enddatum (optional)"
    )
    
    # =========================================
    # Einstellungen
    # =========================================
    is_active = Column(
        Boolean, 
        default=True,
        comment="Aktiv?"
    )
    priority = Column(
        Integer, 
        default=0,
        comment="Priorität (höher = wichtiger)"
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
    def is_visible(self) -> bool:
        """Ist die Ankündigung aktuell sichtbar?"""
        now = datetime.utcnow()
        if not self.is_active:
            return False
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        return True
    
    def __repr__(self) -> str:
        return f"<Announcement {self.text[:50]}...>"

