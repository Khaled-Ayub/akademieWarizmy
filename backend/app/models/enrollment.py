# ===========================================
# WARIZMY EDUCATION - Enrollment Models
# ===========================================
# Modelle für Seminar-Einschreibungen und Lektions-Fortschritt

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class EnrollmentType(str, enum.Enum):
    """Art der Einschreibung"""
    ONE_TIME = "one_time"        # Einmalzahlung
    SUBSCRIPTION = "subscription" # Monatliches Abo


class EnrollmentStatus(str, enum.Enum):
    """Einschreibungsstatus"""
    ACTIVE = "active"          # Aktiv
    CANCELLED = "cancelled"    # Gekündigt
    EXPIRED = "expired"        # Abgelaufen


class Enrollment(Base):
    """
    Seminar-Einschreibung (ohne Klasse).
    
    Für Seminare, die keiner festen Klasse zugeordnet sind.
    Der Student hat Zugang zu den Kursinhalten aus Strapi.
    """
    __tablename__ = "enrollments"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Einschreibungs-ID"
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Benutzer-ID"
    )
    
    # =========================================
    # Strapi-Referenz
    # =========================================
    strapi_course_id = Column(
        Integer, 
        nullable=False, 
        index=True,
        comment="ID des Kurses/Seminars in Strapi CMS"
    )
    
    # =========================================
    # Einschreibungsdetails
    # =========================================
    enrollment_type = Column(
        Enum(EnrollmentType), 
        nullable=False,
        comment="Art der Einschreibung"
    )
    status = Column(
        Enum(EnrollmentStatus), 
        default=EnrollmentStatus.ACTIVE,
        comment="Status der Einschreibung"
    )
    
    # =========================================
    # Zeitraum
    # =========================================
    started_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Einschreibung ab"
    )
    expires_at = Column(
        DateTime, 
        nullable=True,
        comment="Gültig bis (für Abos)"
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
    user = relationship("User", back_populates="enrollments")
    
    # Zahlungen für diese Einschreibung
    payments = relationship(
        "Payment", 
        back_populates="enrollment",
        cascade="all, delete-orphan"
    )
    
    # Abonnement für diese Einschreibung
    subscription = relationship(
        "Subscription", 
        back_populates="enrollment",
        uselist=False
    )
    
    # =========================================
    # Properties
    # =========================================
    @property
    def is_active(self) -> bool:
        """Ist die Einschreibung aktiv?"""
        if self.status != EnrollmentStatus.ACTIVE:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True
    
    def __repr__(self) -> str:
        return f"<Enrollment user={self.user_id} course={self.strapi_course_id}>"


class LessonProgress(Base):
    """
    Lektions-Fortschritt.
    
    Speichert den Fortschritt eines Studenten in einer Lektion
    (Video angesehen, Quiz bestanden).
    """
    __tablename__ = "lesson_progress"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Fortschritts-ID"
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Benutzer-ID"
    )
    
    # =========================================
    # Strapi-Referenzen
    # =========================================
    strapi_lesson_id = Column(
        Integer, 
        nullable=False,
        comment="ID der Lektion in Strapi CMS"
    )
    strapi_course_id = Column(
        Integer, 
        nullable=False,
        comment="ID des Kurses in Strapi CMS"
    )
    
    # =========================================
    # Video-Fortschritt
    # =========================================
    watched_seconds = Column(
        Integer, 
        default=0,
        comment="Angesehene Sekunden des Videos"
    )
    completed = Column(
        Boolean, 
        default=False,
        comment="Lektion abgeschlossen?"
    )
    completed_at = Column(
        DateTime, 
        nullable=True,
        comment="Wann abgeschlossen"
    )
    
    # =========================================
    # Quiz-Ergebnis
    # =========================================
    quiz_score = Column(
        Integer, 
        nullable=True,
        comment="Quiz-Punktzahl (in Prozent)"
    )
    quiz_passed = Column(
        Boolean, 
        nullable=True,
        comment="Quiz bestanden?"
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
    # Constraints
    # =========================================
    __table_args__ = (
        # Ein User kann nur einen Fortschritt pro Lektion haben
        UniqueConstraint('user_id', 'strapi_lesson_id', name='uq_user_lesson'),
    )
    
    # =========================================
    # Relationships
    # =========================================
    user = relationship("User", back_populates="lesson_progress")
    
    def __repr__(self) -> str:
        return f"<LessonProgress user={self.user_id} lesson={self.strapi_lesson_id}>"

