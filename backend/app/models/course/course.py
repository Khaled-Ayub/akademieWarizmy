# ===========================================
# WARIZMY EDUCATION - Course Model
# ===========================================
# Kurs-Modell für Kurse und Seminare

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, Numeric, Enum, Table, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class CourseType(str, enum.Enum):
    """Kurstyp"""
    COURSE = "course"       # Regelmäßiger Kurs
    SEMINAR = "seminar"     # Einmaliges Seminar


class CourseCategory(str, enum.Enum):
    """Kurskategorie"""
    ARABIC = "arabic"       # Arabisch
    ISLAMIC = "islamic"     # Islamwissenschaften


class CourseLevel(str, enum.Enum):
    """Kurslevel"""
    BEGINNER = "beginner"           # Anfänger
    INTERMEDIATE = "intermediate"   # Fortgeschritten
    ADVANCED = "advanced"           # Experte


class PriceType(str, enum.Enum):
    """Preismodell"""
    ONE_TIME = "one_time"       # Einmalzahlung
    SUBSCRIPTION = "subscription"  # Abo
    BOTH = "both"               # Beides möglich


# Many-to-Many Tabelle für Kurs-Lehrer-Beziehung
course_teachers = Table(
    'course_teachers',
    Base.metadata,
    Column('course_id', UUID(as_uuid=True), ForeignKey('courses.id', ondelete='CASCADE'), primary_key=True),
    Column('teacher_profile_id', UUID(as_uuid=True), ForeignKey('teacher_profiles.id', ondelete='CASCADE'), primary_key=True)
)


class Course(Base):
    """
    Kurs-Modell.
    
    Enthält alle Kursinformationen inkl. Preis, Kategorie und Lektionen.
    """
    __tablename__ = "courses"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Kurs-ID (UUID)"
    )
    
    # =========================================
    # Basis-Informationen
    # =========================================
    title = Column(
        String(255), 
        nullable=False,
        comment="Kurstitel"
    )
    slug = Column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True,
        comment="URL-Slug (eindeutig)"
    )
    description = Column(
        Text, 
        nullable=True,
        comment="Ausführliche Beschreibung (HTML/Markdown)"
    )
    short_description = Column(
        String(500), 
        nullable=True,
        comment="Kurzbeschreibung für Karten"
    )
    
    # =========================================
    # Medien
    # =========================================
    thumbnail_url = Column(
        String(500), 
        nullable=True,
        comment="Thumbnail-Bild URL"
    )
    preview_video_url = Column(
        String(500), 
        nullable=True,
        comment="Vorschau-Video URL (Vimeo)"
    )
    
    # =========================================
    # Preisgestaltung
    # =========================================
    price = Column(
        Numeric(10, 2), 
        default=0,
        comment="Preis (Einmalzahlung)"
    )
    price_type = Column(
        Enum(PriceType), 
        default=PriceType.ONE_TIME,
        comment="Preismodell"
    )
    subscription_price = Column(
        Numeric(10, 2), 
        nullable=True,
        comment="Monatlicher Abo-Preis"
    )
    
    # =========================================
    # Kategorisierung
    # =========================================
    course_type = Column(
        Enum(CourseType), 
        default=CourseType.COURSE,
        comment="Kurstyp (Kurs/Seminar)"
    )
    category = Column(
        Enum(CourseCategory), 
        nullable=False,
        comment="Kategorie (Arabisch/Islamisch)"
    )
    level = Column(
        Enum(CourseLevel), 
        default=CourseLevel.BEGINNER,
        comment="Schwierigkeitsgrad"
    )
    
    # =========================================
    # Zusätzliche Materialien
    # =========================================
    book_affiliate_link = Column(
        String(500), 
        nullable=True,
        comment="Affiliate-Link zum Kursbuch"
    )
    book_pdf_url = Column(
        String(500), 
        nullable=True,
        comment="PDF-Download URL"
    )
    
    # =========================================
    # Standort
    # =========================================
    default_location_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
        comment="Standard-Standort des Kurses"
    )
    session_type = Column(
        String(20),
        default="online",
        comment="Unterrichtsart: online, onsite, hybrid"
    )
    
    # =========================================
    # Kurs-Einstellungen
    # =========================================
    duration_weeks = Column(
        Integer, 
        nullable=True,
        comment="Kursdauer in Wochen"
    )
    max_students = Column(
        Integer, 
        nullable=True,
        comment="Maximale Teilnehmerzahl"
    )
    order = Column(
        Integer, 
        default=0,
        comment="Sortierreihenfolge"
    )
    
    # =========================================
    # Status
    # =========================================
    is_active = Column(
        Boolean, 
        default=True,
        comment="Kurs aktiv?"
    )
    is_featured = Column(
        Boolean, 
        default=False,
        comment="Auf Startseite hervorheben?"
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
    published_at = Column(
        DateTime, 
        nullable=True,
        comment="Veröffentlicht am"
    )
    
    # =========================================
    # Relationships
    # =========================================
    lessons = relationship(
        "Lesson", 
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Lesson.order"
    )
    
    teachers = relationship(
        "TeacherProfile",
        secondary=course_teachers,
        back_populates="courses"
    )
    
    default_location = relationship(
        "Location",
        foreign_keys=[default_location_id]
    )
    
    # Klassen die diesen Kurs verwenden
    classes = relationship(
        "Class",
        back_populates="course"
    )
    
    testimonials = relationship(
        "Testimonial", 
        back_populates="course",
        cascade="all, delete-orphan"
    )
    
    # Einschreibungen
    enrollments = relationship(
        "Enrollment", 
        back_populates="course",
        cascade="all, delete-orphan"
    )
    
    # =========================================
    # Properties
    # =========================================
    @property
    def lesson_count(self) -> int:
        """Anzahl der Lektionen"""
        return len(self.lessons) if self.lessons else 0
    
    @property
    def total_duration_minutes(self) -> int:
        """Gesamtdauer aller Lektionen in Minuten"""
        if not self.lessons:
            return 0
        return sum(l.duration_minutes or 0 for l in self.lessons)
    
    def __repr__(self) -> str:
        return f"<Course {self.title}>"

