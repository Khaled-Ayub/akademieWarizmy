# ===========================================
# WARIZMY EDUCATION - Lesson Model
# ===========================================
# Lektion-Modell für Kurslektionen

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class QuestionType(str, enum.Enum):
    """Quiz-Fragentyp"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"


class ContentType(str, enum.Enum):
    """Lektions-Inhaltstyp"""
    VIDEO = "video"           # Nur Video
    TEXT = "text"             # Nur formatierter Text
    PDF = "pdf"               # Nur PDF
    MIXED = "mixed"           # Kombination aus mehreren


class Lesson(Base):
    """
    Lektion-Modell.
    
    Einzelne Lektion innerhalb eines Kurses mit Video und Quiz.
    """
    __tablename__ = "lessons"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Lektions-ID (UUID)"
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    course_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("courses.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Kurs-ID"
    )
    
    # =========================================
    # Basis-Informationen
    # =========================================
    title = Column(
        String(255), 
        nullable=False,
        comment="Lektionstitel"
    )
    slug = Column(
        String(255), 
        nullable=False, 
        index=True,
        comment="URL-Slug"
    )
    description = Column(
        Text, 
        nullable=True,
        comment="Beschreibung (HTML/Markdown)"
    )
    order = Column(
        Integer, 
        default=0, 
        nullable=False,
        comment="Sortierreihenfolge"
    )
    
    # =========================================
    # Content-Typ
    # =========================================
    content_type = Column(
        String(20),
        default="video",
        nullable=False,
        comment="Inhaltstyp: video, text, pdf, mixed"
    )
    
    # =========================================
    # Video
    # =========================================
    vimeo_video_id = Column(
        String(100), 
        nullable=True,
        comment="Vimeo Video ID"
    )
    vimeo_video_url = Column(
        String(500), 
        nullable=True,
        comment="Vimeo Video URL"
    )
    duration_minutes = Column(
        Integer, 
        nullable=True,
        comment="Videodauer in Minuten"
    )
    
    # =========================================
    # Text-Inhalt (Rich Text / HTML)
    # =========================================
    text_content = Column(
        Text,
        nullable=True,
        comment="Formatierter Text-Inhalt (HTML)"
    )
    
    # =========================================
    # PDF
    # =========================================
    pdf_url = Column(
        String(500),
        nullable=True,
        comment="URL zur PDF-Datei"
    )
    pdf_name = Column(
        String(255),
        nullable=True,
        comment="Originaler PDF-Dateiname"
    )
    
    # =========================================
    # Materialien (als JSON Array)
    # =========================================
    materials = Column(
        JSONB, 
        nullable=True,
        default=list,
        comment="Materialien [{name, url, type}]"
    )
    
    # =========================================
    # Quiz (eingebettet als JSON)
    # =========================================
    has_quiz = Column(
        Boolean, 
        default=False,
        comment="Hat Quiz?"
    )
    quiz_title = Column(
        String(255), 
        nullable=True,
        comment="Quiz-Titel"
    )
    quiz_passing_score = Column(
        Integer, 
        default=70,
        comment="Bestehensgrenze in %"
    )
    quiz_questions = Column(
        JSONB, 
        nullable=True,
        default=list,
        comment="Quiz-Fragen [{question_text, question_type, options, correct_answer, explanation}]"
    )
    
    # =========================================
    # Einstellungen
    # =========================================
    is_free_preview = Column(
        Boolean, 
        default=False,
        comment="Kostenlose Vorschau?"
    )
    is_published = Column(
        Boolean, 
        default=False,
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
    
    # =========================================
    # Relationships
    # =========================================
    course = relationship("Course", back_populates="lessons")
    
    # Fortschritt der Benutzer
    progress = relationship(
        "LessonProgress", 
        back_populates="lesson",
        cascade="all, delete-orphan"
    )

    # Hausaufgaben
    homework = relationship(
        "Homework",
        back_populates="lesson",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Lesson {self.title} (Course: {self.course_id})>"

