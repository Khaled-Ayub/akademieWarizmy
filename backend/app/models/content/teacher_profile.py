# ===========================================
# WARIZMY EDUCATION - Teacher Profile Model
# ===========================================
# Lehrer-Profil für öffentliche Darstellung

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.course.course import course_teachers


class TeacherProfile(Base):
    """
    Lehrer-Profil Modell.
    
    Öffentliches Profil eines Lehrers für die Website-Darstellung.
    Kann optional mit einem User-Account verknüpft sein.
    """
    __tablename__ = "teacher_profiles"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Profil-ID (UUID)"
    )
    
    # =========================================
    # Optionale User-Verknüpfung
    # =========================================
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True,
        unique=True,
        comment="Verknüpfter User-Account (optional)"
    )
    
    # =========================================
    # Profil-Informationen
    # =========================================
    name = Column(
        String(255), 
        nullable=False,
        comment="Anzeigename (z.B. 'Ustadh Ahmad')"
    )
    slug = Column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True,
        comment="URL-Slug"
    )
    bio = Column(
        Text, 
        nullable=True,
        comment="Biografie (HTML/Markdown)"
    )
    qualifications = Column(
        Text, 
        nullable=True,
        comment="Qualifikationen und Zertifikate"
    )
    
    # =========================================
    # Kontakt
    # =========================================
    email = Column(
        String(255), 
        nullable=True,
        comment="Öffentliche E-Mail (optional)"
    )
    
    # =========================================
    # Medien
    # =========================================
    photo_url = Column(
        String(500), 
        nullable=True,
        comment="Profilbild URL"
    )
    
    # =========================================
    # Einstellungen
    # =========================================
    order = Column(
        Integer, 
        default=0,
        comment="Sortierreihenfolge"
    )
    is_active = Column(
        Boolean, 
        default=True,
        comment="Profil aktiv?"
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
    # Relationships
    # =========================================
    user = relationship("User", backref="teacher_profile")
    
    courses = relationship(
        "Course",
        secondary=course_teachers,
        back_populates="teachers"
    )
    
    def __repr__(self) -> str:
        return f"<TeacherProfile {self.name}>"

