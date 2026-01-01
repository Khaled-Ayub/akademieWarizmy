# ===========================================
# WARIZMY EDUCATION - Exams Router
# ===========================================
# Prüfungs-Endpunkte (Termine, Buchungen, PVL)

from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.database import get_db
from app.config import get_settings
from app.models.user import User
from app.models.exam import ExamSlot, ExamBooking, ExamBookingStatus, ExamResult
from app.models.session import Attendance, AttendanceStatus
from app.models.class_model import ClassEnrollment
from app.routers.auth import get_current_user

settings = get_settings()
router = APIRouter()


# =========================================
# Pydantic Schemas
# =========================================
class ExamSlotResponse(BaseModel):
    """Schema für Prüfungstermin"""
    id: str
    class_id: str
    strapi_course_id: int
    scheduled_at: datetime
    duration_minutes: int
    is_available: bool
    
    class Config:
        from_attributes = True


class ExamBookingResponse(BaseModel):
    """Schema für Prüfungsbuchung"""
    id: str
    exam_slot: ExamSlotResponse
    status: str
    pvl_fulfilled: bool
    result: Optional[str]
    grade: Optional[float]
    examined_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PVLStatusResponse(BaseModel):
    """Schema für PVL-Status"""
    course_id: int
    total_sessions: int
    attended_sessions: int
    attendance_percentage: float
    pvl_threshold: float
    pvl_fulfilled: bool


class ExamBookingCreate(BaseModel):
    """Schema für Prüfungsbuchung erstellen"""
    exam_slot_id: str


class GradeResponse(BaseModel):
    """Schema für Note"""
    course_id: int
    grade: Optional[float]
    grade_display: str
    result: Optional[str]
    examined_at: Optional[datetime]
    certificate_issued: bool
    
    class Config:
        from_attributes = True


# =========================================
# Helper-Funktionen
# =========================================
async def calculate_pvl_status(
    user_id: str, 
    class_id: str, 
    db: AsyncSession
) -> PVLStatusResponse:
    """
    Berechnet den PVL-Status (Prüfungsvorleistung) für einen Studenten.
    
    PVL ist erfüllt bei mindestens 80% Anwesenheit.
    """
    # Alle Sessions der Klasse zählen (vergangene, nicht abgesagte)
    from app.models.session import LiveSession
    
    result = await db.execute(
        select(func.count(LiveSession.id))
        .where(LiveSession.class_id == class_id)
        .where(LiveSession.scheduled_at < datetime.utcnow())
        .where(LiveSession.is_cancelled == False)
    )
    total_sessions = result.scalar() or 0
    
    if total_sessions == 0:
        return PVLStatusResponse(
            course_id=0,  # Wird später gesetzt
            total_sessions=0,
            attended_sessions=0,
            attendance_percentage=0.0,
            pvl_threshold=settings.PVL_ATTENDANCE_THRESHOLD * 100,
            pvl_fulfilled=False,
        )
    
    # Anwesenheiten zählen
    result = await db.execute(
        select(func.count(Attendance.id))
        .join(LiveSession)
        .where(Attendance.user_id == user_id)
        .where(LiveSession.class_id == class_id)
        .where(Attendance.status == AttendanceStatus.PRESENT)
    )
    attended_sessions = result.scalar() or 0
    
    # Prozentsatz berechnen
    attendance_percentage = (attended_sessions / total_sessions) * 100
    pvl_fulfilled = attendance_percentage >= (settings.PVL_ATTENDANCE_THRESHOLD * 100)
    
    return PVLStatusResponse(
        course_id=0,
        total_sessions=total_sessions,
        attended_sessions=attended_sessions,
        attendance_percentage=round(attendance_percentage, 1),
        pvl_threshold=settings.PVL_ATTENDANCE_THRESHOLD * 100,
        pvl_fulfilled=pvl_fulfilled,
    )


# =========================================
# API Endpunkte
# =========================================
@router.get("/slots", response_model=List[ExamSlotResponse])
async def get_exam_slots(
    course_id: Optional[int] = None,
    available_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verfügbare Prüfungstermine abrufen.
    """
    query = select(ExamSlot).where(ExamSlot.scheduled_at > datetime.utcnow())
    
    if course_id:
        query = query.where(ExamSlot.strapi_course_id == course_id)
    
    if available_only:
        query = query.where(ExamSlot.is_booked == False)
    
    query = query.order_by(ExamSlot.scheduled_at)
    
    result = await db.execute(query)
    slots = result.scalars().all()
    
    return [
        ExamSlotResponse(
            id=str(s.id),
            class_id=str(s.class_id),
            strapi_course_id=s.strapi_course_id,
            scheduled_at=s.scheduled_at,
            duration_minutes=s.duration_minutes,
            is_available=not s.is_booked,
        )
        for s in slots
    ]


@router.get("/my-pvl/{course_id}", response_model=PVLStatusResponse)
async def get_my_pvl_status(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meinen PVL-Status für einen Kurs abrufen.
    """
    # Klasse finden, in der der Student eingeschrieben ist
    from app.models.class_model import Class
    
    result = await db.execute(
        select(ClassEnrollment)
        .join(Class)
        .where(ClassEnrollment.user_id == current_user.id)
        .where(Class.strapi_course_id == course_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Keine Einschreibung für diesen Kurs gefunden"
        )
    
    pvl_status = await calculate_pvl_status(
        str(current_user.id), 
        str(enrollment.class_id), 
        db
    )
    pvl_status.course_id = course_id
    
    return pvl_status


@router.post("/book", response_model=ExamBookingResponse)
async def book_exam(
    data: ExamBookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Prüfungstermin buchen.
    
    Nur möglich, wenn PVL erfüllt ist.
    """
    # Slot laden
    result = await db.execute(
        select(ExamSlot).where(ExamSlot.id == data.exam_slot_id)
    )
    slot = result.scalar_one_or_none()
    
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prüfungstermin nicht gefunden"
        )
    
    if slot.is_booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Termin ist bereits gebucht"
        )
    
    if slot.scheduled_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Termin liegt in der Vergangenheit"
        )
    
    # PVL prüfen
    pvl_status = await calculate_pvl_status(
        str(current_user.id), 
        str(slot.class_id), 
        db
    )
    
    if not pvl_status.pvl_fulfilled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PVL nicht erfüllt. Aktuelle Anwesenheit: {pvl_status.attendance_percentage}% (benötigt: {pvl_status.pvl_threshold}%)"
        )
    
    # Prüfen ob Student schon eine Buchung hat
    result = await db.execute(
        select(ExamBooking)
        .join(ExamSlot)
        .where(ExamBooking.user_id == current_user.id)
        .where(ExamSlot.strapi_course_id == slot.strapi_course_id)
        .where(ExamBooking.status.in_([ExamBookingStatus.SCHEDULED, ExamBookingStatus.COMPLETED]))
    )
    existing_booking = result.scalar_one_or_none()
    
    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sie haben bereits einen Prüfungstermin für diesen Kurs"
        )
    
    # Buchung erstellen
    booking = ExamBooking(
        user_id=current_user.id,
        exam_slot_id=slot.id,
        status=ExamBookingStatus.SCHEDULED,
        pvl_fulfilled=True,
    )
    db.add(booking)
    
    # Slot als gebucht markieren
    slot.is_booked = True
    
    await db.commit()
    await db.refresh(booking)
    await db.refresh(slot)
    
    return ExamBookingResponse(
        id=str(booking.id),
        exam_slot=ExamSlotResponse(
            id=str(slot.id),
            class_id=str(slot.class_id),
            strapi_course_id=slot.strapi_course_id,
            scheduled_at=slot.scheduled_at,
            duration_minutes=slot.duration_minutes,
            is_available=False,
        ),
        status=booking.status.value,
        pvl_fulfilled=booking.pvl_fulfilled,
        result=booking.result.value if booking.result else None,
        grade=float(booking.grade) if booking.grade else None,
        examined_at=booking.examined_at,
    )


@router.get("/my-bookings", response_model=List[ExamBookingResponse])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meine Prüfungsbuchungen abrufen.
    """
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(ExamBooking)
        .options(selectinload(ExamBooking.exam_slot))
        .where(ExamBooking.user_id == current_user.id)
        .order_by(ExamBooking.created_at.desc())
    )
    bookings = result.scalars().all()
    
    return [
        ExamBookingResponse(
            id=str(b.id),
            exam_slot=ExamSlotResponse(
                id=str(b.exam_slot.id),
                class_id=str(b.exam_slot.class_id),
                strapi_course_id=b.exam_slot.strapi_course_id,
                scheduled_at=b.exam_slot.scheduled_at,
                duration_minutes=b.exam_slot.duration_minutes,
                is_available=not b.exam_slot.is_booked,
            ),
            status=b.status.value,
            pvl_fulfilled=b.pvl_fulfilled,
            result=b.result.value if b.result else None,
            grade=float(b.grade) if b.grade else None,
            examined_at=b.examined_at,
        )
        for b in bookings
    ]


@router.get("/my-grades", response_model=List[GradeResponse])
async def get_my_grades(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Meine Noten abrufen.
    """
    from sqlalchemy.orm import selectinload
    from app.models.certificate import Certificate
    
    result = await db.execute(
        select(ExamBooking)
        .options(selectinload(ExamBooking.exam_slot))
        .where(ExamBooking.user_id == current_user.id)
        .where(ExamBooking.status == ExamBookingStatus.COMPLETED)
    )
    bookings = result.scalars().all()
    
    # Zertifikate laden
    course_ids = [b.exam_slot.strapi_course_id for b in bookings]
    result = await db.execute(
        select(Certificate)
        .where(Certificate.user_id == current_user.id)
        .where(Certificate.strapi_course_id.in_(course_ids))
    )
    certificates = {c.strapi_course_id: c for c in result.scalars().all()}
    
    grades = []
    for b in bookings:
        grade_display = "Noch nicht bewertet"
        if b.grade:
            grade_names = {
                1.0: "sehr gut", 1.3: "sehr gut",
                1.7: "gut", 2.0: "gut", 2.3: "gut",
                2.7: "befriedigend", 3.0: "befriedigend", 3.3: "befriedigend",
                3.7: "ausreichend", 4.0: "ausreichend",
                5.0: "nicht bestanden",
            }
            grade_float = float(b.grade)
            grade_display = f"{b.grade} ({grade_names.get(grade_float, '')})"
        
        grades.append(GradeResponse(
            course_id=b.exam_slot.strapi_course_id,
            grade=float(b.grade) if b.grade else None,
            grade_display=grade_display,
            result=b.result.value if b.result else None,
            examined_at=b.examined_at,
            certificate_issued=b.exam_slot.strapi_course_id in certificates,
        ))
    
    return grades


@router.delete("/bookings/{booking_id}")
async def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Prüfungsbuchung stornieren.
    """
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(ExamBooking)
        .options(selectinload(ExamBooking.exam_slot))
        .where(ExamBooking.id == booking_id)
        .where(ExamBooking.user_id == current_user.id)
    )
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buchung nicht gefunden"
        )
    
    if booking.status != ExamBookingStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nur geplante Prüfungen können storniert werden"
        )
    
    # Buchung stornieren
    booking.status = ExamBookingStatus.CANCELLED
    
    # Slot wieder freigeben
    booking.exam_slot.is_booked = False
    
    await db.commit()
    
    return {"message": "Prüfungsbuchung storniert"}

