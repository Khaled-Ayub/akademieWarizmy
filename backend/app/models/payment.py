# ===========================================
# WARIZMY EDUCATION - Payment Models
# ===========================================
# Modelle für Zahlungen, Abonnements und Rechnungen

import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class PaymentMethod(str, enum.Enum):
    """Zahlungsmethode"""
    STRIPE = "stripe"                 # Kreditkarte über Stripe
    PAYPAL = "paypal"                 # PayPal
    BANK_TRANSFER = "bank_transfer"   # Banküberweisung


class PaymentStatus(str, enum.Enum):
    """Zahlungsstatus"""
    PENDING = "pending"       # Ausstehend
    COMPLETED = "completed"   # Abgeschlossen
    FAILED = "failed"         # Fehlgeschlagen
    REFUNDED = "refunded"     # Erstattet


class SubscriptionStatus(str, enum.Enum):
    """Abonnement-Status"""
    ACTIVE = "active"         # Aktiv
    CANCELLED = "cancelled"   # Gekündigt
    PAST_DUE = "past_due"     # Zahlung überfällig


class Payment(Base):
    """
    Zahlung.
    
    Speichert alle Zahlungen (Einmal und Abo-Zahlungen).
    """
    __tablename__ = "payments"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Zahlungs-ID"
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True, 
        index=True,
        comment="Benutzer-ID"
    )
    enrollment_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("enrollments.id", ondelete="SET NULL"), 
        nullable=True,
        comment="Einschreibungs-ID (falls vorhanden)"
    )
    
    # =========================================
    # Betrag
    # =========================================
    amount = Column(
        Numeric(10, 2), 
        nullable=False,
        comment="Betrag in Euro"
    )
    currency = Column(
        String(3), 
        default="EUR",
        comment="Währung (ISO 4217)"
    )
    
    # =========================================
    # Zahlungsdetails
    # =========================================
    payment_method = Column(
        Enum(PaymentMethod), 
        nullable=False,
        comment="Zahlungsmethode"
    )
    payment_status = Column(
        Enum(PaymentStatus), 
        default=PaymentStatus.PENDING, 
        index=True,
        comment="Zahlungsstatus"
    )
    
    # =========================================
    # Provider-IDs
    # =========================================
    stripe_payment_id = Column(
        String(255), 
        nullable=True,
        comment="Stripe Payment Intent ID"
    )
    paypal_order_id = Column(
        String(255), 
        nullable=True,
        comment="PayPal Order ID"
    )
    bank_transfer_reference = Column(
        String(100), 
        nullable=True,
        comment="Verwendungszweck für Überweisung"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    paid_at = Column(
        DateTime, 
        nullable=True,
        comment="Wann bezahlt"
    )
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Erstellt am"
    )
    
    # =========================================
    # Relationships
    # =========================================
    user = relationship("User", back_populates="payments")
    enrollment = relationship("Enrollment", back_populates="payments")
    
    # Rechnung für diese Zahlung
    invoice = relationship(
        "Invoice", 
        back_populates="payment", 
        uselist=False
    )
    
    # =========================================
    # Properties
    # =========================================
    @property
    def is_paid(self) -> bool:
        """Ist die Zahlung abgeschlossen?"""
        return self.payment_status == PaymentStatus.COMPLETED
    
    def __repr__(self) -> str:
        return f"<Payment {self.id} {self.amount} {self.currency} ({self.payment_status.value})>"


class Subscription(Base):
    """
    Abonnement.
    
    Verwaltet wiederkehrende Zahlungen für Kurse.
    """
    __tablename__ = "subscriptions"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Abo-ID"
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
    enrollment_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("enrollments.id", ondelete="CASCADE"), 
        nullable=False,
        comment="Einschreibungs-ID"
    )
    
    # =========================================
    # Provider-IDs
    # =========================================
    stripe_subscription_id = Column(
        String(255), 
        nullable=True,
        comment="Stripe Subscription ID"
    )
    paypal_subscription_id = Column(
        String(255), 
        nullable=True,
        comment="PayPal Subscription ID"
    )
    
    # =========================================
    # Status
    # =========================================
    status = Column(
        Enum(SubscriptionStatus), 
        default=SubscriptionStatus.ACTIVE,
        comment="Abo-Status"
    )
    
    # =========================================
    # Abrechnungszeitraum
    # =========================================
    current_period_start = Column(
        DateTime, 
        nullable=True,
        comment="Aktueller Zeitraum Start"
    )
    current_period_end = Column(
        DateTime, 
        nullable=True,
        comment="Aktueller Zeitraum Ende"
    )
    
    # =========================================
    # Kündigung
    # =========================================
    cancel_at_period_end = Column(
        Boolean, 
        default=False,
        comment="Am Ende des Zeitraums kündigen?"
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
    user = relationship("User", back_populates="subscriptions")
    enrollment = relationship("Enrollment", back_populates="subscription")
    
    # =========================================
    # Properties
    # =========================================
    @property
    def is_active(self) -> bool:
        """Ist das Abo aktiv?"""
        return self.status == SubscriptionStatus.ACTIVE
    
    def __repr__(self) -> str:
        return f"<Subscription {self.id} ({self.status.value})>"


class Invoice(Base):
    """
    Rechnung.
    
    Generiert für jede erfolgreiche Zahlung.
    """
    __tablename__ = "invoices"
    
    # =========================================
    # Primärschlüssel
    # =========================================
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="Eindeutige Rechnungs-ID"
    )
    
    # =========================================
    # Fremdschlüssel
    # =========================================
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True,
        comment="Benutzer-ID"
    )
    payment_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("payments.id", ondelete="SET NULL"), 
        nullable=True,
        comment="Zahlungs-ID"
    )
    
    # =========================================
    # Rechnungsdetails
    # =========================================
    invoice_number = Column(
        String(50), 
        unique=True, 
        nullable=False,
        comment="Rechnungsnummer (z.B. WE-2026-00001)"
    )
    
    # =========================================
    # Beträge
    # =========================================
    amount = Column(
        Numeric(10, 2), 
        nullable=False,
        comment="Netto-Betrag"
    )
    tax_amount = Column(
        Numeric(10, 2), 
        default=0,
        comment="MwSt-Betrag"
    )
    total_amount = Column(
        Numeric(10, 2), 
        nullable=False,
        comment="Gesamt-Betrag (Brutto)"
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
    user = relationship("User")
    payment = relationship("Payment", back_populates="invoice")
    
    def __repr__(self) -> str:
        return f"<Invoice {self.invoice_number}>"

