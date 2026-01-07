# ===========================================
# WARIZMY EDUCATION - User Model
# ===========================================
# Benutzer-Modell für Studenten, Lehrer und Admins

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class UserRole(str, enum.Enum):
    """Benutzerrollen"""
    STUDENT = "student"      # Lernender
    TEACHER = "teacher"      # Lehrender
    ADMIN = "admin"          # Administrator


class User(Base):
    """
    Benutzer-Modell.
    
    Enthält alle Benutzerinformationen für Studenten, Lehrer und Admins.
    Die Rolle bestimmt die Zugriffsrechte im System.
    """
    __tablename__ = "users"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Benutzer-ID (UUID)"
    )
    
    # =========================================
    # Authentifizierung
    # =========================================
    email = Column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True,
        comment="E-Mail-Adresse (Login)"
    )
    password_hash = Column(
        String(255), 
        nullable=False,
        comment="Gehashtes Passwort (bcrypt)"
    )
    
    # =========================================
    # Persönliche Daten
    # =========================================
    first_name = Column(
        String(100), 
        nullable=False,
        comment="Vorname"
    )
    last_name = Column(
        String(100), 
        nullable=False,
        comment="Nachname"
    )
    phone = Column(
        String(50), 
        nullable=True,
        comment="Telefonnummer"
    )
    
    # =========================================
    # Adresse
    # =========================================
    address_street = Column(
        String(255), 
        nullable=True,
        comment="Straße und Hausnummer"
    )
    address_city = Column(
        String(100), 
        nullable=True,
        comment="Stadt"
    )
    address_zip = Column(
        String(20), 
        nullable=True,
        comment="Postleitzahl"
    )
    address_country = Column(
        String(100), 
        default="Deutschland",
        comment="Land"
    )

    # =========================================
    # Onboarding / zusätzliche Profilfelder
    # =========================================
    date_of_birth = Column(
        Date,
        nullable=True,
        comment="Geburtsdatum"
    )
    newsletter_opt_in = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Newsletter erhalten?"
    )
    whatsapp_opt_in = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="WhatsApp Updates erhalten?"
    )
    whatsapp_channel_opt_in = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="WhatsApp Channel beitreten?"
    )
    onboarding_completed = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Onboarding/Profil vollständig?"
    )
    
    # =========================================
    # Rolle & Status
    # =========================================
    role = Column(
        Enum(UserRole), 
        default=UserRole.STUDENT,
        nullable=False,
        comment="Benutzerrolle (student, teacher, admin)"
    )
    is_active = Column(
        Boolean, 
        default=True,
        comment="Aktiv (false = gesperrt)"
    )
    email_verified = Column(
        Boolean, 
        default=False,
        comment="E-Mail bestätigt?"
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
    # Klassen als Lehrer (wenn Teacher)
    teaching_classes = relationship(
        "ClassTeacher", 
        back_populates="teacher",
        cascade="all, delete-orphan"
    )
    
    # Klassen als Student (Einschreibungen)
    class_enrollments = relationship(
        "ClassEnrollment", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Seminar-Einschreibungen (ohne Klasse)
    enrollments = relationship(
        "Enrollment", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Lektions-Fortschritt
    lesson_progress = relationship(
        "LessonProgress", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Zahlungen
    payments = relationship(
        "Payment", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Abonnements
    subscriptions = relationship(
        "Subscription", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Anwesenheitsbestätigungen
    attendance_confirmations = relationship(
        "AttendanceConfirmation", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Anwesenheiten
    attendances = relationship(
        "Attendance", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Prüfungsbuchungen
    exam_bookings = relationship(
        "ExamBooking", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Zertifikate
    certificates = relationship(
        "Certificate", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # =========================================
    # Properties
    # =========================================
    @property
    def full_name(self) -> str:
        """Vollständiger Name (Vorname Nachname)"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_teacher(self) -> bool:
        """Ist der Benutzer ein Lehrer?"""
        return self.role == UserRole.TEACHER
    
    @property
    def is_admin(self) -> bool:
        """Ist der Benutzer ein Admin?"""
        return self.role == UserRole.ADMIN
    
    @property
    def is_student(self) -> bool:
        """Ist der Benutzer ein Student?"""
        return self.role == UserRole.STUDENT
    
    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"

