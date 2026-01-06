# ===========================================
# WARIZMY EDUCATION - Testimonial Model
# ===========================================
# Kundenbewertungen

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Testimonial(Base):
    """
    Testimonial-Modell.
    
    Kundenbewertungen für Kurse oder allgemein.
    """
    __tablename__ = "testimonials"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Testimonial-ID (UUID)"
    )
    
    # =========================================
    # Fremdschlüssel (optional)
    # =========================================
    course_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("courses.id", ondelete="SET NULL"), 
        nullable=True, 
        index=True,
        comment="Kurs-ID (optional)"
    )
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True,
        comment="User-ID (wenn registrierter Nutzer)"
    )
    
    # =========================================
    # Inhalt
    # =========================================
    name = Column(
        String(255), 
        nullable=False,
        comment="Name des Bewertenden"
    )
    content = Column(
        Text, 
        nullable=False,
        comment="Bewertungstext"
    )
    rating = Column(
        Integer, 
        default=5,
        comment="Sterne-Bewertung (1-5)"
    )
    
    # =========================================
    # Medien
    # =========================================
    photo_url = Column(
        String(500), 
        nullable=True,
        comment="Foto URL"
    )
    
    # =========================================
    # Einstellungen
    # =========================================
    is_featured = Column(
        Boolean, 
        default=False,
        comment="Auf Startseite zeigen?"
    )
    is_published = Column(
        Boolean, 
        default=True,
        comment="Veröffentlicht?"
    )
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
    
    # =========================================
    # Relationships
    # =========================================
    course = relationship("Course", back_populates="testimonials")
    
    def __repr__(self) -> str:
        return f"<Testimonial {self.name}: {self.rating}★>"

