# ===========================================
# WARIZMY EDUCATION - Exam Models Package
# ===========================================
# Prüfungs-bezogene Modelle

from app.models.exam.exam import (
    ExamSlot,
    ExamBooking,
    ExamBookingStatus,
    ExamResult,
)

__all__ = [
    "ExamSlot",
    "ExamBooking",
    "ExamBookingStatus",
    "ExamResult",
]

