# ===========================================
# WARIZMY EDUCATION - Homework Model
# ===========================================
# Hausaufgaben-Modell für Lektionen

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class SubmissionStatus(str, enum.Enum):
    """Status der Hausaufgaben-Abgabe"""
    PENDING = "pending"           # Noch nicht abgegeben
    SUBMITTED = "submitted"       # Abgegeben, wartet auf Bewertung
    GRADED = "graded"             # Bewertet
    LATE = "late"                 # Verspätet abgegeben
    RESUBMIT = "resubmit"         # Muss überarbeitet werden


class Homework(Base):
    """
    Hausaufgaben-Modell.
    
    Hausaufgabe zu einer Lektion mit Abgabefrist und Materialien.
    """
    __tablename__ = "homework"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Hausaufgaben-ID (UUID)"
    )
    
    # =========================================
    # Fremdschlüssel
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
    title = Column(
        String(255), 
        nullable=False,
        comment="Hausaufgaben-Titel"
    )
    description = Column(
        Text, 
        nullable=True,
        comment="Beschreibung/Anweisungen (HTML)"
    )
    
    # =========================================
    # Abgabe-Einstellungen
    # =========================================
    deadline = Column(
        DateTime, 
        nullable=True,
        comment="Abgabefrist"
    )
    allow_late_submission = Column(
        Boolean, 
        default=True,
        comment="Verspätete Abgabe erlauben?"
    )
    max_file_size_mb = Column(
        Integer, 
        default=10,
        comment="Maximale Dateigröße in MB"
    )
    allowed_file_types = Column(
        JSONB, 
        nullable=True,
        default=lambda: ["pdf", "doc", "docx", "txt", "jpg", "png"],
        comment="Erlaubte Dateitypen"
    )
    max_files = Column(
        Integer, 
        default=5,
        comment="Maximale Anzahl an Dateien"
    )
    
    # =========================================
    # Content-Typ (wie bei Lektionen)
    # =========================================
    content_type = Column(
        String(20),
        default="text",
        nullable=False,
        comment="Inhaltstyp: video, text, pdf, mixed"
    )
    
    # =========================================
    # Video (Vimeo)
    # =========================================
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
        comment="Formatierter Text-Inhalt (HTML/Markdown)"
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
    # Materialien (herunterladbar für Schüler)
    # =========================================
    materials = Column(
        JSONB, 
        nullable=True,
        default=list,
        comment="Materialien [{name, url, type}]"
    )
    
    # =========================================
    # Bewertung
    # =========================================
    max_points = Column(
        Integer, 
        nullable=True,
        comment="Maximale Punktzahl"
    )
    
    # =========================================
    # Einstellungen
    # =========================================
    is_active = Column(
        Boolean, 
        default=True,
        comment="Aktiv/Sichtbar?"
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
    Hausaufgaben-Abgabe Modell.
    
    Abgabe eines Schülers zu einer Hausaufgabe.
    """
    __tablename__ = "homework_submissions"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Abgabe-ID (UUID)"
    )
    
    # =========================================
    # Fremdschlüssel
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
        comment="Schüler-ID"
    )
    
    # =========================================
    # Abgabe-Inhalt
    # =========================================
    text_content = Column(
        Text, 
        nullable=True,
        comment="Textantwort (optional)"
    )
    files = Column(
        JSONB, 
        nullable=True,
        default=list,
        comment="Hochgeladene Dateien [{name, url, size, uploaded_at}]"
    )
    
    # =========================================
    # Status & Zeitstempel
    # =========================================
    status = Column(
        String(20),
        default="pending",
        nullable=False,
        comment="Abgabe-Status: pending, submitted, graded, late, resubmit"
    )
    submitted_at = Column(
        DateTime, 
        nullable=True,
        comment="Abgabezeitpunkt"
    )
    is_late = Column(
        Boolean, 
        default=False,
        comment="Verspätet abgegeben?"
    )
    
    # =========================================
    # Bewertung
    # =========================================
    points = Column(
        Integer, 
        nullable=True,
        comment="Erreichte Punktzahl"
    )
    feedback = Column(
        Text, 
        nullable=True,
        comment="Lehrer-Feedback"
    )
    graded_at = Column(
        DateTime, 
        nullable=True,
        comment="Bewertungszeitpunkt"
    )
    graded_by = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True,
        comment="Bewertet von (Lehrer-ID)"
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
    homework = relationship("Homework", back_populates="submissions")
    student = relationship(
        "User", 
        foreign_keys=[student_id],
        backref="homework_submissions"
    )
    grader = relationship(
        "User", 
        foreign_keys=[graded_by]
    )
    
    def __repr__(self) -> str:
        return f"<HomeworkSubmission {self.id} (Student: {self.student_id})>"

