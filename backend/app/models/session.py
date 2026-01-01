# ===========================================
# WARIZMY EDUCATION - Session Models
# ===========================================
# Modelle für Live-Sessions, Teilnahmebestätigung und Anwesenheit

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Enum, UniqueConstraint, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class SessionType(str, enum.Enum):
    """Unterrichtsart"""
    ONLINE = "online"      # Nur Online (Zoom)
    ONSITE = "onsite"      # Nur Vor-Ort
    HYBRID = "hybrid"      # Beides


class AttendanceStatus(str, enum.Enum):
    """Anwesenheitsstatus"""
    PRESENT = "present"                   # Anwesend
    ABSENT_EXCUSED = "absent_excused"     # Entschuldigt abwesend
    ABSENT_UNEXCUSED = "absent_unexcused" # Unentschuldigt abwesend


class CheckInMethod(str, enum.Enum):
    """Wie wurde die Anwesenheit erfasst?"""
    ZOOM_AUTO = "zoom_auto"       # Automatisch durch Zoom Webhook
    MANUAL = "manual"             # Manuell vom Lehrer eingetragen
    SELF_CONFIRMED = "self_confirmed"  # Vom Studenten selbst bestätigt


class LiveSession(Base):
    """
    Live-Session (Unterrichtstermin).
    
    Einzelner Unterrichtstermin, generiert aus dem Stundenplan (ClassSchedule)
    oder manuell erstellt.
    """
    __tablename__ = "live_sessions"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Session-ID"
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
    created_by = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id"), 
        nullable=True,
        comment="Erstellt von (User-ID)"
    )
    
    # =========================================
    # Strapi-Referenzen
    # =========================================
    strapi_course_id = Column(
        Integer, 
        nullable=False,
        comment="Kurs-ID in Strapi"
    )
    strapi_lesson_id = Column(
        Integer, 
        nullable=True,
        comment="Lektion-ID in Strapi (optional)"
    )
    
    # =========================================
    # Session-Details
    # =========================================
    title = Column(
        String(255), 
        nullable=False,
        comment="Titel der Session"
    )
    description = Column(
        Text, 
        nullable=True,
        comment="Beschreibung"
    )
    
    # =========================================
    # Art & Ort
    # =========================================
    session_type = Column(
        Enum(SessionType), 
        default=SessionType.ONLINE,
        comment="Art des Unterrichts"
    )
    location = Column(
        String(255), 
        nullable=True,
        comment="Ort für Vor-Ort-Unterricht"
    )
    
    # =========================================
    # Zeitplan
    # =========================================
    scheduled_at = Column(
        DateTime, 
        nullable=False, 
        index=True,
        comment="Geplanter Start"
    )
    duration_minutes = Column(
        Integer, 
        default=90,
        comment="Dauer in Minuten"
    )
    
    # =========================================
    # Zoom-Daten
    # =========================================
    zoom_meeting_id = Column(
        String(100), 
        nullable=True,
        comment="Zoom Meeting ID"
    )
    zoom_join_url = Column(
        String(500), 
        nullable=True,
        comment="Zoom Beitritts-URL"
    )
    zoom_password = Column(
        String(50), 
        nullable=True,
        comment="Zoom Passwort"
    )
    
    # =========================================
    # Vimeo (Aufzeichnung)
    # =========================================
    vimeo_video_id = Column(
        String(100), 
        nullable=True,
        comment="Vimeo Video ID (nach Upload)"
    )
    vimeo_video_url = Column(
        String(500), 
        nullable=True,
        comment="Vimeo Video URL"
    )
    
    # =========================================
    # Status
    # =========================================
    is_cancelled = Column(
        Boolean, 
        default=False,
        comment="Session abgesagt?"
    )
    cancel_reason = Column(
        String(255), 
        nullable=True,
        comment="Grund für Absage"
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
    class_ = relationship("Class", back_populates="live_sessions")
    
    # Teilnahmebestätigungen (Student bestätigt vorher)
    confirmations = relationship(
        "AttendanceConfirmation", 
        back_populates="live_session",
        cascade="all, delete-orphan"
    )
    
    # Anwesenheiten (tatsächliche Teilnahme)
    attendances = relationship(
        "Attendance", 
        back_populates="live_session",
        cascade="all, delete-orphan"
    )
    
    # =========================================
    # Properties
    # =========================================
    @property
    def is_past(self) -> bool:
        """Ist die Session bereits vorbei?"""
        return datetime.utcnow() > self.scheduled_at
    
    @property
    def is_upcoming(self) -> bool:
        """Ist die Session in der Zukunft?"""
        return datetime.utcnow() < self.scheduled_at and not self.is_cancelled
    
    def __repr__(self) -> str:
        return f"<LiveSession {self.title} @ {self.scheduled_at}>"


class AttendanceConfirmation(Base):
    """
    Teilnahmebestätigung.
    
    Student bestätigt vorher, ob er an einer Session teilnehmen wird.
    Wird im Dashboard angezeigt: "Nimmst du teil? Ja/Nein"
    """
    __tablename__ = "attendance_confirmations"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Bestätigungs-ID"
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
    live_session_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("live_sessions.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Session-ID"
    )
    
    # =========================================
    # Bestätigung
    # =========================================
    will_attend = Column(
        Boolean, 
        nullable=False,
        comment="Wird teilnehmen? (Ja/Nein)"
    )
    absence_reason = Column(
        Text, 
        nullable=True,
        comment="Grund für Nichtteilnahme (optional)"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    confirmed_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Wann bestätigt"
    )
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Erstellt am"
    )
    
    # =========================================
    # Constraints
    # =========================================
    __table_args__ = (
        # Ein User kann nur eine Bestätigung pro Session haben
        UniqueConstraint('user_id', 'live_session_id', name='uq_user_session_confirmation'),
    )
    
    # =========================================
    # Relationships
    # =========================================
    user = relationship("User", back_populates="attendance_confirmations")
    live_session = relationship("LiveSession", back_populates="confirmations")
    
    def __repr__(self) -> str:
        return f"<AttendanceConfirmation user={self.user_id} will_attend={self.will_attend}>"


class Attendance(Base):
    """
    Anwesenheit.
    
    Tatsächliche Teilnahme an einer Session.
    Kann automatisch (Zoom Webhook) oder manuell erfasst werden.
    """
    __tablename__ = "attendance"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Anwesenheits-ID"
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
    live_session_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("live_sessions.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Session-ID"
    )
    
    # =========================================
    # Anwesenheitsdetails
    # =========================================
    attendance_type = Column(
        Enum(SessionType), 
        nullable=False,
        comment="Teilnahme-Art (online/onsite)"
    )
    status = Column(
        Enum(AttendanceStatus), 
        default=AttendanceStatus.PRESENT,
        comment="Anwesenheitsstatus"
    )
    
    # =========================================
    # Check-In
    # =========================================
    checked_in_at = Column(
        DateTime, 
        nullable=True,
        comment="Wann eingecheckt"
    )
    checked_in_by = Column(
        Enum(CheckInMethod), 
        nullable=True,
        comment="Wie eingecheckt"
    )
    
    # =========================================
    # Notizen
    # =========================================
    notes = Column(
        Text, 
        nullable=True,
        comment="Notizen (Lehrer)"
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
        # Ein User kann nur eine Anwesenheit pro Session haben
        UniqueConstraint('user_id', 'live_session_id', name='uq_user_session_attendance'),
    )
    
    # =========================================
    # Relationships
    # =========================================
    user = relationship("User", back_populates="attendances")
    live_session = relationship("LiveSession", back_populates="attendances")
    
    # =========================================
    # Properties
    # =========================================
    @property
    def is_present(self) -> bool:
        """War der Student anwesend?"""
        return self.status == AttendanceStatus.PRESENT
    
    @property
    def is_excused(self) -> bool:
        """War die Abwesenheit entschuldigt?"""
        return self.status == AttendanceStatus.ABSENT_EXCUSED
    
    def __repr__(self) -> str:
        return f"<Attendance user={self.user_id} status={self.status.value}>"

