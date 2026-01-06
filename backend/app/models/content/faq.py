# ===========================================
# WARIZMY EDUCATION - FAQ Model
# ===========================================
# Häufig gestellte Fragen

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class FAQ(Base):
    """
    FAQ-Modell.
    
    Häufig gestellte Fragen für die FAQ-Seite.
    """
    __tablename__ = "faqs"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige FAQ-ID (UUID)"
    )
    
    # =========================================
    # Inhalt
    # =========================================
    question = Column(
        String(500), 
        nullable=False,
        comment="Frage"
    )
    answer = Column(
        Text, 
        nullable=False,
        comment="Antwort (HTML/Markdown)"
    )
    category = Column(
        String(100), 
        nullable=True,
        comment="Kategorie (z.B. 'Kurse', 'Zahlung')"
    )
    
    # =========================================
    # Einstellungen
    # =========================================
    order = Column(
        Integer, 
        default=0,
        comment="Sortierreihenfolge"
    )
    is_published = Column(
        Boolean, 
        default=True,
        comment="Veröffentlicht?"
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
        return f"<FAQ {self.question[:50]}...>"

