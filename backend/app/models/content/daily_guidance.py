# ===========================================
# WARIZMY EDUCATION - Daily Guidance Model
# ===========================================
# Islamische Tageshinweise

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.db.base import Base


class Weekday(str, enum.Enum):
    """Wochentag"""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"
    EVERYDAY = "everyday"


class RamadanMode(str, enum.Enum):
    """Ramadan-Modus"""
    ONLY = "only"           # Nur während Ramadan
    EXCLUDE = "exclude"     # Nicht während Ramadan
    BOTH = "both"           # Immer


class DailyGuidance(Base):
    """
    Tageshinweis-Modell.
    
    Islamische Tageshinweise je nach Wochentag und optional Ramadan.
    """
    __tablename__ = "daily_guidances"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Hinweis-ID (UUID)"
    )
    
    # =========================================
    # Inhalt
    # =========================================
    title = Column(
        String(120), 
        nullable=True,
        comment="Titel (optional)"
    )
    text = Column(
        Text, 
        nullable=False,
        comment="Hinweistext"
    )
    
    # =========================================
    # Link (optional)
    # =========================================
    link_url = Column(
        String(500), 
        nullable=True,
        comment="Link-URL"
    )
    link_text = Column(
        String(80), 
        default="Mehr erfahren",
        comment="Link-Text"
    )
    
    # =========================================
    # Zeitliche Steuerung
    # =========================================
    weekday = Column(
        Enum(Weekday), 
        default=Weekday.EVERYDAY,
        nullable=False,
        comment="Wochentag"
    )
    ramadan_mode = Column(
        Enum(RamadanMode), 
        default=RamadanMode.BOTH,
        nullable=False,
        comment="Ramadan-Modus"
    )
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
        comment="Priorität"
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
    
    def __repr__(self) -> str:
        return f"<DailyGuidance {self.weekday.value}: {self.text[:30]}...>"

