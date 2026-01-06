# ===========================================
# WARIZMY EDUCATION - Class Models
# ===========================================
# Modelle für Klassen, Lehrer-Zuordnung, Stundenplan und Einschreibungen

import uuid
from datetime import datetime, date, time
from sqlalchemy import Column, String, Boolean, DateTime, Date, Time, Integer, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class SessionType(str, enum.Enum):
    """Unterrichtsart"""
    ONLINE = "online"      # Nur Online (Zoom)
    ONSITE = "onsite"      # Nur Vor-Ort
    HYBRID = "hybrid"      # Beides


class EnrollmentStatus(str, enum.Enum):
    """Einschreibungsstatus"""
    ACTIVE = "active"          # Aktiv
    CANCELLED = "cancelled"    # Gekündigt
    EXPIRED = "expired"        # Abgelaufen


class Class(Base):
    """
    Klassen-Modell.
    
    Eine Klasse ist eine Gruppe von Studenten, die einen Kurs gemeinsam
    zu festen Terminen besuchen (z.B. "Arabisch A1 - Herbst 2026").
    
    Der Kursinhalt (Lektionen, Videos) kommt aus dem Course-Model.
    """
    __tablename__ = "classes"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Klassen-ID"
    )
    
    # =========================================
    # Kurs-Referenz
    # =========================================
    course_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False, 
        index=True,
        comment="ID des Kurses"
    )
    
    # =========================================
    # Klassen-Informationen
    # =========================================
    name = Column(
        String(255), 
        nullable=False,
        comment="Klassenname (z.B. 'Arabisch A1 - Herbst 2026')"
    )
    description = Column(
        String(1000), 
        nullable=True,
        comment="Beschreibung der Klasse"
    )
    
    # =========================================
    # Zeitraum
    # =========================================
    start_date = Column(
        Date, 
        nullable=False,
        comment="Startdatum der Klasse"
    )
    end_date = Column(
        Date, 
        nullable=True,
        comment="Enddatum der Klasse (optional)"
    )
    
    # =========================================
    # Kapazität & Status
    # =========================================
    max_students = Column(
        Integer, 
        nullable=True,
        comment="Maximale Teilnehmerzahl (null = unbegrenzt)"
    )
    is_active = Column(
        Boolean, 
        default=True,
        comment="Klasse ist aktiv?"
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
    # Lehrer dieser Klasse
    teachers = relationship(
        "ClassTeacher", 
        back_populates="class_",
        cascade="all, delete-orphan"
    )
    
    # Stundenplan
    schedules = relationship(
        "ClassSchedule", 
        back_populates="class_",
        cascade="all, delete-orphan"
    )
    
    # Eingeschriebene Studenten
    enrollments = relationship(
        "ClassEnrollment", 
        back_populates="class_",
        cascade="all, delete-orphan"
    )
    
    # Live-Sessions dieser Klasse
    live_sessions = relationship(
        "LiveSession", 
        back_populates="class_",
        cascade="all, delete-orphan"
    )
    
    # Prüfungstermine dieser Klasse
    exam_slots = relationship(
        "ExamSlot", 
        back_populates="class_",
        cascade="all, delete-orphan"
    )
    
    # Klassen-spezifische Ferien
    holidays = relationship(
        "Holiday", 
        back_populates="class_",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Class {self.name}>"


class ClassTeacher(Base):
    """
    Lehrer-Klassen-Zuordnung.
    
    Eine Klasse kann mehrere Lehrer haben, einer davon ist der Hauptlehrer.
    """
    __tablename__ = "class_teachers"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    class_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("classes.id", ondelete="CASCADE"), 
        nullable=False,
        comment="Klassen-ID"
    )
    teacher_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        comment="Lehrer-ID (User mit Rolle 'teacher')"
    )
    
    # =========================================
    # Eigenschaften
    # =========================================
    is_primary = Column(
        Boolean, 
        default=False,
        comment="Ist Hauptlehrer der Klasse?"
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
    # Constraints
    # =========================================
    __table_args__ = (
        # Ein Lehrer kann nur einmal einer Klasse zugeordnet sein
        UniqueConstraint('class_id', 'teacher_id', name='uq_class_teacher'),
    )
    
    # =========================================
    # Relationships
    # =========================================
    class_ = relationship("Class", back_populates="teachers")
    teacher = relationship("User", back_populates="teaching_classes")
    
    def __repr__(self) -> str:
        return f"<ClassTeacher class={self.class_id} teacher={self.teacher_id}>"


class ClassSchedule(Base):
    """
    Stundenplan einer Klasse.
    
    Definiert die wiederkehrenden Termine (z.B. jeden Montag 18:00-19:30).
    Aus diesen werden die Live-Sessions generiert.
    """
    __tablename__ = "class_schedules"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    class_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("classes.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Klassen-ID"
    )
    
    # =========================================
    # Zeitplan
    # =========================================
    day_of_week = Column(
        Integer, 
        nullable=False,
        comment="Wochentag (0=Montag, 6=Sonntag)"
    )
    start_time = Column(
        Time, 
        nullable=False,
        comment="Startzeit"
    )
    end_time = Column(
        Time, 
        nullable=False,
        comment="Endzeit"
    )
    
    # =========================================
    # Unterrichtsart
    # =========================================
    session_type = Column(
        Enum(SessionType), 
        default=SessionType.HYBRID,
        comment="Art des Unterrichts"
    )
    location = Column(
        String(255), 
        nullable=True,
        comment="Ort für Vor-Ort-Unterricht"
    )
    
    # =========================================
    # Zoom-Daten (für Online)
    # =========================================
    zoom_meeting_id = Column(
        String(100), 
        nullable=True,
        comment="Zoom Meeting ID (wenn wiederkehrend)"
    )
    zoom_join_url = Column(
        String(500), 
        nullable=True,
        comment="Zoom Beitritts-URL"
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
    class_ = relationship("Class", back_populates="schedules")
    
    # =========================================
    # Properties
    # =========================================
    @property
    def day_name(self) -> str:
        """Wochentag als Text"""
        days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
        return days[self.day_of_week] if 0 <= self.day_of_week <= 6 else "Unbekannt"
    
    def __repr__(self) -> str:
        return f"<ClassSchedule {self.day_name} {self.start_time}-{self.end_time}>"


class ClassEnrollment(Base):
    """
    Klassen-Einschreibung.
    
    Verbindet einen Studenten mit einer Klasse.
    Unterscheidet zwischen Einmalzahlung und Abo.
    """
    __tablename__ = "class_enrollments"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
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
    class_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("classes.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Klassen-ID"
    )
    
    # =========================================
    # Einschreibungsdetails
    # =========================================
    enrollment_type = Column(
        String(20), 
        nullable=False,
        comment="Art der Einschreibung (one_time, subscription)"
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
    # Constraints
    # =========================================
    __table_args__ = (
        # Ein Student kann nur einmal in einer Klasse sein
        UniqueConstraint('user_id', 'class_id', name='uq_user_class'),
    )
    
    # =========================================
    # Relationships
    # =========================================
    user = relationship("User", back_populates="class_enrollments")
    class_ = relationship("Class", back_populates="enrollments")
    
    def __repr__(self) -> str:
        return f"<ClassEnrollment user={self.user_id} class={self.class_id}>"

