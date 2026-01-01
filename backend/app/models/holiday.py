# ===========================================
# WARIZMY EDUCATION - Holiday Model
# ===========================================
# Modell für unterrichtsfreie Zeiten (Ferien, Feiertage)

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Holiday(Base):
    """
    Unterrichtsfreie Zeit.
    
    Ferien und Feiertage, an denen kein Unterricht stattfindet.
    Kann für alle Klassen oder nur für eine bestimmte Klasse gelten.
    """
    __tablename__ = "holidays"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Holiday-ID"
    )
    
    # =========================================
    # Fremdschlüssel (optional)
    # =========================================
    class_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("classes.id", ondelete="CASCADE"), 
        nullable=True, 
        index=True,
        comment="Nur für diese Klasse (null = alle)"
    )
    
    # =========================================
    # Details
    # =========================================
    name = Column(
        String(255), 
        nullable=False,
        comment="Name (z.B. 'Winterferien', 'Eid al-Fitr')"
    )
    
    # =========================================
    # Zeitraum
    # =========================================
    start_date = Column(
        Date, 
        nullable=False, 
        index=True,
        comment="Startdatum"
    )
    end_date = Column(
        Date, 
        nullable=False,
        comment="Enddatum"
    )
    
    # =========================================
    # Geltungsbereich
    # =========================================
    applies_to_all = Column(
        Boolean, 
        default=True,
        comment="Gilt für alle Klassen?"
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
    class_ = relationship("Class", back_populates="holidays")
    
    # =========================================
    # Properties
    # =========================================
    @property
    def duration_days(self) -> int:
        """Dauer in Tagen"""
        return (self.end_date - self.start_date).days + 1
    
    @property
    def is_active(self) -> bool:
        """Ist heute in diesem Ferien-Zeitraum?"""
        today = date.today()
        return self.start_date <= today <= self.end_date
    
    @property
    def is_upcoming(self) -> bool:
        """Liegt in der Zukunft?"""
        return self.start_date > date.today()
    
    def __repr__(self) -> str:
        return f"<Holiday {self.name} ({self.start_date} - {self.end_date})>"

