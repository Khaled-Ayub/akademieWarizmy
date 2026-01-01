# ===========================================
# WARIZMY EDUCATION - Payments Router
# ===========================================
# Zahlungs-Endpunkte (Stripe, PayPal, Banküberweisung)

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import stripe

from app.database import get_db
from app.config import get_settings
from app.models.user import User
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.enrollment import Enrollment, EnrollmentType, EnrollmentStatus
from app.routers.auth import get_current_user

settings = get_settings()
router = APIRouter()

# Stripe konfigurieren
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


# =========================================
# Pydantic Schemas
# =========================================
class StripeCheckoutCreate(BaseModel):
    """Schema für Stripe Checkout"""
    course_id: int
    course_name: str
    price: float
    enrollment_type: str  # one_time oder subscription


class PayPalOrderCreate(BaseModel):
    """Schema für PayPal Order"""
    course_id: int
    course_name: str
    price: float


class BankTransferNotify(BaseModel):
    """Schema für Überweisungsmeldung"""
    course_id: int
    amount: float
    reference: str


# =========================================
# Stripe Endpunkte
# =========================================
@router.post("/stripe/create-checkout")
async def create_stripe_checkout(
    data: StripeCheckoutCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Stripe Checkout Session erstellen.
    
    Gibt URL zurück, zu der der Benutzer weitergeleitet werden soll.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe ist nicht konfiguriert"
        )
    
    try:
        # Checkout Session erstellen
        if data.enrollment_type == "subscription":
            # Abo-Modus
            session = stripe.checkout.Session.create(
                mode="subscription",
                customer_email=current_user.email,
                line_items=[
                    {
                        "price_data": {
                            "currency": "eur",
                            "product_data": {
                                "name": data.course_name,
                            },
                            "unit_amount": int(data.price * 100),  # In Cent
                            "recurring": {"interval": "month"},
                        },
                        "quantity": 1,
                    }
                ],
                success_url=f"{settings.STRIPE_SUCCESS_URL}?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=settings.STRIPE_CANCEL_URL,
                metadata={
                    "user_id": str(current_user.id),
                    "course_id": data.course_id,
                    "enrollment_type": data.enrollment_type,
                },
            )
        else:
            # Einmalzahlung
            session = stripe.checkout.Session.create(
                mode="payment",
                customer_email=current_user.email,
                line_items=[
                    {
                        "price_data": {
                            "currency": "eur",
                            "product_data": {
                                "name": data.course_name,
                            },
                            "unit_amount": int(data.price * 100),  # In Cent
                        },
                        "quantity": 1,
                    }
                ],
                success_url=f"{settings.STRIPE_SUCCESS_URL}?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=settings.STRIPE_CANCEL_URL,
                metadata={
                    "user_id": str(current_user.id),
                    "course_id": data.course_id,
                    "enrollment_type": data.enrollment_type,
                },
            )
        
        return {"checkout_url": session.url, "session_id": session.id}
        
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe Fehler: {str(e)}"
        )


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db)
):
    """
    Stripe Webhook für Zahlungsbestätigungen.
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe Webhook ist nicht konfiguriert"
        )
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Ungültiger Payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Ungültige Signatur")
    
    # Event verarbeiten
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        
        # Metadaten extrahieren
        user_id = session["metadata"]["user_id"]
        course_id = int(session["metadata"]["course_id"])
        enrollment_type = session["metadata"]["enrollment_type"]
        
        # Zahlung erstellen
        payment = Payment(
            user_id=user_id,
            amount=session["amount_total"] / 100,  # Von Cent zu Euro
            currency="EUR",
            payment_method=PaymentMethod.STRIPE,
            payment_status=PaymentStatus.COMPLETED,
            stripe_payment_id=session["payment_intent"],
            paid_at=datetime.utcnow(),
        )
        db.add(payment)
        
        # Einschreibung erstellen
        enrollment = Enrollment(
            user_id=user_id,
            strapi_course_id=course_id,
            enrollment_type=EnrollmentType(enrollment_type),
            status=EnrollmentStatus.ACTIVE,
        )
        db.add(enrollment)
        
        # Zahlung mit Einschreibung verknüpfen
        await db.flush()
        payment.enrollment_id = enrollment.id
        
        await db.commit()
        
        # TODO: Bestätigungs-E-Mail senden
        # TODO: Rechnung erstellen
    
    return {"received": True}


# =========================================
# PayPal Endpunkte
# =========================================
@router.post("/paypal/create-order")
async def create_paypal_order(
    data: PayPalOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    PayPal Order erstellen.
    
    TODO: PayPal SDK Integration implementieren
    """
    if not settings.PAYPAL_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PayPal ist nicht konfiguriert"
        )
    
    # TODO: PayPal Order erstellen
    # import paypalrestsdk
    # paypalrestsdk.configure({...})
    
    return {
        "message": "PayPal Integration wird noch implementiert",
        "order_id": "PAYPAL_ORDER_123"
    }


@router.post("/paypal/capture")
async def capture_paypal_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    PayPal Zahlung abschließen.
    
    TODO: PayPal Capture implementieren
    """
    return {"message": "PayPal Capture wird noch implementiert"}


# =========================================
# Banküberweisung
# =========================================
@router.post("/bank-transfer/notify")
async def notify_bank_transfer(
    data: BankTransferNotify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Banküberweisung melden (muss noch von Admin bestätigt werden).
    """
    # Zahlung mit Status "pending" erstellen
    payment = Payment(
        user_id=current_user.id,
        amount=data.amount,
        currency="EUR",
        payment_method=PaymentMethod.BANK_TRANSFER,
        payment_status=PaymentStatus.PENDING,
        bank_transfer_reference=data.reference,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    return {
        "message": "Überweisung gemeldet. Sie wird nach Eingang freigeschaltet.",
        "payment_id": str(payment.id),
        "reference": data.reference,
    }


# =========================================
# Zahlungs-Abfragen
# =========================================
@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Zahlungsdetails abrufen.
    """
    result = await db.execute(
        select(Payment)
        .where(Payment.id == payment_id)
        .where(Payment.user_id == current_user.id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zahlung nicht gefunden"
        )
    
    return {
        "id": str(payment.id),
        "amount": float(payment.amount),
        "currency": payment.currency,
        "payment_method": payment.payment_method.value,
        "payment_status": payment.payment_status.value,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        "created_at": payment.created_at.isoformat(),
    }


@router.get("/{payment_id}/invoice")
async def get_payment_invoice(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Rechnung für Zahlung herunterladen.
    
    TODO: PDF-Generierung und MinIO-Download implementieren
    """
    result = await db.execute(
        select(Payment)
        .where(Payment.id == payment_id)
        .where(Payment.user_id == current_user.id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zahlung nicht gefunden"
        )
    
    if payment.payment_status != PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rechnung nur für abgeschlossene Zahlungen verfügbar"
        )
    
    # TODO: PDF aus MinIO laden und zurückgeben
    return {"message": "Rechnungs-Download wird noch implementiert"}

