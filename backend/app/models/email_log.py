# ===========================================
# WARIZMY EDUCATION - Email Log Model
# ===========================================
# Modell für E-Mail-Protokollierung

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class EmailType(str, enum.Enum):
    """Art der E-Mail"""
    WELCOME = "welcome"                           # Willkommen
    EMAIL_VERIFICATION = "email_verification"     # E-Mail bestätigen
    PASSWORD_RESET = "password_reset"             # Passwort zurücksetzen
    PURCHASE_CONFIRMATION = "purchase_confirmation"  # Kaufbestätigung
    PAYMENT_REMINDER = "payment_reminder"         # Zahlungserinnerung
    SESSION_REMINDER = "session_reminder"         # Session-Erinnerung
    EXAM_REMINDER = "exam_reminder"               # Prüfungs-Erinnerung
    EXAM_RESULT = "exam_result"                   # Prüfungsergebnis
    CERTIFICATE = "certificate"                   # Zertifikat
    INVOICE = "invoice"                           # Rechnung
    CLASS_CANCELLED = "class_cancelled"           # Unterricht abgesagt
    GENERAL = "general"                           # Allgemein


class EmailStatus(str, enum.Enum):
    """Status der E-Mail"""
    SENT = "sent"         # Gesendet
    FAILED = "failed"     # Fehlgeschlagen
    BOUNCED = "bounced"   # Zurückgewiesen


class EmailLog(Base):
    """
    E-Mail-Log.
    
    Protokolliert alle versendeten E-Mails für Nachverfolgung
    und Debugging.
    """
    __tablename__ = "email_logs"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Log-ID"
    )
    
    # =========================================
    # Fremdschlüssel (optional)
    # =========================================
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True,
        comment="Empfänger (User-ID)"
    )
    
    # =========================================
    # E-Mail-Details
    # =========================================
    email_type = Column(
        Enum(EmailType), 
        nullable=False,
        comment="Art der E-Mail"
    )
    recipient_email = Column(
        String(255), 
        nullable=False,
        comment="Empfänger E-Mail-Adresse"
    )
    subject = Column(
        String(255), 
        nullable=False,
        comment="Betreff"
    )
    
    # =========================================
    # Status
    # =========================================
    status = Column(
        Enum(EmailStatus), 
        default=EmailStatus.SENT,
        comment="Versand-Status"
    )
    error_message = Column(
        Text, 
        nullable=True,
        comment="Fehlermeldung (bei Fehler)"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    sent_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Gesendet am"
    )
    
    # =========================================
    # Relationships
    # =========================================
    user = relationship("User")
    
    def __repr__(self) -> str:
        return f"<EmailLog {self.email_type.value} to {self.recipient_email}>"

