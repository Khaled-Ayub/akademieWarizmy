# ===========================================
# WARIZMY EDUCATION - Certificate Model
# ===========================================
# Modell für Kurs-Zertifikate

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Certificate(Base):
    """
    Zertifikat.
    
    Wird nach bestandener Prüfung ausgestellt.
    Enthält eine eindeutige Zertifikatsnummer zur Verifizierung.
    """
    __tablename__ = "certificates"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Zertifikats-ID"
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        comment="Inhaber des Zertifikats"
    )
    exam_booking_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("exam_bookings.id"), 
        nullable=True,
        comment="Zugehörige Prüfungsbuchung"
    )
    
    # =========================================
    # Strapi-Referenz
    # =========================================
    strapi_course_id = Column(
        Integer, 
        nullable=False,
        comment="Kurs-ID in Strapi"
    )
    
    # =========================================
    # Zertifikatsdetails
    # =========================================
    certificate_number = Column(
        String(50), 
        unique=True, 
        nullable=False,
        comment="Eindeutige Zertifikatsnummer (z.B. WE-CERT-2026-00001)"
    )
    
    # =========================================
    # PDF
    # =========================================
    pdf_path = Column(
        String(500), 
        nullable=True,
        comment="Pfad zur PDF in MinIO"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    issued_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Ausgestellt am"
    )
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Erstellt am"
    )
    
    # =========================================
    # Relationships
    # =========================================
    user = relationship("User", back_populates="certificates")
    exam_booking = relationship("ExamBooking", back_populates="certificate")
    
    # =========================================
    # Properties
    # =========================================
    @property
    def verification_url(self) -> str:
        """URL zur Verifizierung des Zertifikats"""
        return f"https://ac.warizmy.com/zertifikat/verifizieren/{self.certificate_number}"
    
    def __repr__(self) -> str:
        return f"<Certificate {self.certificate_number}>"

