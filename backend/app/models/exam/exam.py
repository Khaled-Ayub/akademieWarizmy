# ===========================================
# WARIZMY EDUCATION - Exam Models
# ===========================================
# Modelle für Prüfungstermine und Prüfungsbuchungen

import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Enum, UniqueConstraint, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class ExamBookingStatus(str, enum.Enum):
    """Status der Prüfungsbuchung"""
    SCHEDULED = "scheduled"   # Gebucht
    COMPLETED = "completed"   # Durchgeführt
    CANCELLED = "cancelled"   # Storniert
    NO_SHOW = "no_show"       # Nicht erschienen


class ExamResult(str, enum.Enum):
    """Prüfungsergebnis"""
    PASSED = "passed"     # Bestanden
    FAILED = "failed"     # Nicht bestanden


class ExamSlot(Base):
    """
    Prüfungstermin.
    
    Ein verfügbarer Zeitslot für eine mündliche Prüfung.
    Kann von einem Studenten gebucht werden (wenn PVL erfüllt).
    """
    __tablename__ = "exam_slots"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Slot-ID"
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
    examiner_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id"), 
        nullable=True,
        comment="Prüfer (Lehrer-ID)"
    )
    
    # =========================================
    # Kurs-Referenz
    # =========================================
    course_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        comment="ID des Kurses"
    )
    
    # =========================================
    # Zeitplan
    # =========================================
    scheduled_at = Column(
        DateTime, 
        nullable=False, 
        index=True,
        comment="Prüfungstermin"
    )
    duration_minutes = Column(
        Integer, 
        default=30,
        comment="Dauer in Minuten"
    )
    
    # =========================================
    # Zoom-Daten (für Online-Prüfung)
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
    
    # =========================================
    # Status
    # =========================================
    is_booked = Column(
        Boolean, 
        default=False,
        comment="Bereits gebucht?"
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
    class_ = relationship("Class", back_populates="exam_slots")
    examiner = relationship("User")
    
    # Buchung für diesen Slot
    booking = relationship(
        "ExamBooking", 
        back_populates="exam_slot", 
        uselist=False
    )
    
    # =========================================
    # Properties
    # =========================================
    @property
    def is_available(self) -> bool:
        """Ist der Slot noch verfügbar?"""
        return not self.is_booked and self.scheduled_at > datetime.utcnow()
    
    def __repr__(self) -> str:
        return f"<ExamSlot {self.scheduled_at} booked={self.is_booked}>"


class ExamBooking(Base):
    """
    Prüfungsbuchung.
    
    Verbindet einen Studenten mit einem Prüfungstermin.
    Enthält auch die Note nach der Prüfung.
    """
    __tablename__ = "exam_bookings"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Buchungs-ID"
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Studenten-ID"
    )
    exam_slot_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("exam_slots.id", ondelete="CASCADE"), 
        nullable=False,
        comment="Prüfungstermin-ID"
    )
    
    # =========================================
    # Status
    # =========================================
    status = Column(
        Enum(ExamBookingStatus), 
        default=ExamBookingStatus.SCHEDULED,
        comment="Buchungsstatus"
    )
    
    # =========================================
    # PVL (Prüfungsvorleistung)
    # =========================================
    pvl_fulfilled = Column(
        Boolean, 
        default=False,
        comment="PVL erfüllt? (80% Anwesenheit)"
    )
    
    # =========================================
    # Ergebnis
    # =========================================
    result = Column(
        Enum(ExamResult), 
        nullable=True,
        comment="Prüfungsergebnis"
    )
    grade = Column(
        Numeric(2, 1), 
        nullable=True,
        comment="Note (z.B. 1.0, 2.3, 3.7)"
    )
    examiner_notes = Column(
        Text, 
        nullable=True,
        comment="Notizen des Prüfers"
    )
    examined_at = Column(
        DateTime, 
        nullable=True,
        comment="Wann geprüft"
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
        # Ein Slot kann nur einmal gebucht werden
        UniqueConstraint('exam_slot_id', name='uq_exam_slot_booking'),
    )
    
    # =========================================
    # Relationships
    # =========================================
    user = relationship("User", back_populates="exam_bookings")
    exam_slot = relationship("ExamSlot", back_populates="booking")
    
    # Zertifikat für diese Prüfung
    certificate = relationship(
        "Certificate", 
        back_populates="exam_booking", 
        uselist=False
    )
    
    # =========================================
    # Properties
    # =========================================
    @property
    def is_passed(self) -> bool:
        """Prüfung bestanden?"""
        return self.result == ExamResult.PASSED
    
    @property
    def grade_display(self) -> str:
        """Note als Text"""
        if not self.grade:
            return "Noch nicht bewertet"
        
        grade_names = {
            1.0: "sehr gut",
            1.3: "sehr gut",
            1.7: "gut",
            2.0: "gut",
            2.3: "gut",
            2.7: "befriedigend",
            3.0: "befriedigend",
            3.3: "befriedigend",
            3.7: "ausreichend",
            4.0: "ausreichend",
            5.0: "nicht bestanden",
        }
        
        grade_float = float(self.grade)
        return f"{self.grade} ({grade_names.get(grade_float, '')})"
    
    def __repr__(self) -> str:
        return f"<ExamBooking user={self.user_id} result={self.result}>"

