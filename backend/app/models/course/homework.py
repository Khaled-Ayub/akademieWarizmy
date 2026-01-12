# ===========================================
# WARIZMY EDUCATION - Homework Models
# ===========================================
# Modelle fuer Hausaufgaben in Lektionen

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Homework(Base):
    """
    Hausaufgabe fuer eine Lektion.
    
    Enthält Aufgabenstellung und Abgabefrist.
    """
    __tablename__ = "homework"
    
    # =========================================
    # Primaerschluessel
    # =========================================
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Eindeutige Hausaufgaben-ID"
    )
    
    # =========================================
    # Fremdschluessel
    # =========================================
    lesson_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Lektions-ID"
    )
    
    # =========================================
    # Basis-Informationen
    # =========================================
    content_type = Column(
        String(20),
        default="mixed",
        nullable=False,
        comment="Inhaltstyp: video, text, pdf, mixed"
    )
    title = Column(
        String(255),
        nullable=False,
        comment="Titel der Hausaufgabe"
    )
    description = Column(
        Text,
        nullable=True,
        comment="Beschreibung / Aufgabenstellung"
    )
    deadline = Column(
        DateTime,
        nullable=False,
        comment="Abgabefrist"
    )
    max_points = Column(
        Integer,
        nullable=True,
        comment="Maximale Punkte"
    )
    is_active = Column(
        Boolean,
        default=True,
        comment="Aktiv?"
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
    lesson = relationship("Lesson", back_populates="homework")
    submissions = relationship(
        "HomeworkSubmission",
        back_populates="homework",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Homework {self.title} (Lesson: {self.lesson_id})>"


class HomeworkSubmission(Base):
    """
    Abgabe einer Hausaufgabe durch einen Studenten.
    """
    __tablename__ = "homework_submissions"
    
    # =========================================
    # Primaerschluessel
    # =========================================
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Eindeutige Abgabe-ID"
    )
    
    # =========================================
    # Fremdschluessel
    # =========================================
    homework_id = Column(
        UUID(as_uuid=True),
        ForeignKey("homework.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Hausaufgaben-ID"
    )
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Studenten-ID"
    )
    
    # =========================================
    # Datei-Informationen
    # =========================================
    file_url = Column(
        String(500),
        nullable=False,
        comment="Datei-URL"
    )
    file_name = Column(
        String(255),
        nullable=True,
        comment="Dateiname"
    )
    file_type = Column(
        String(100),
        nullable=True,
        comment="Dateityp/MIME"
    )
    file_size = Column(
        Integer,
        nullable=True,
        comment="Dateigroesse in Bytes"
    )
    notes = Column(
        Text,
        nullable=True,
        comment="Optionale Notizen"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    submitted_at = Column(
        DateTime,
        default=datetime.utcnow,
        comment="Abgegeben am"
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
        UniqueConstraint("homework_id", "student_id", name="uq_homework_student"),
    )
    
    # =========================================
    # Relationships
    # =========================================
    homework = relationship("Homework", back_populates="submissions")
    student = relationship("User")
    
    def __repr__(self) -> str:
        return f"<HomeworkSubmission homework={self.homework_id} student={self.student_id}>"
