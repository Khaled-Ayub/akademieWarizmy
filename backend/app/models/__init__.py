# ===========================================
# WARIZMY EDUCATION - Modelle Package
# ===========================================
# Alle SQLAlchemy Modelle exportieren

from app.models.user import User
from app.models.class_model import Class, ClassTeacher, ClassSchedule, ClassEnrollment
from app.models.enrollment import Enrollment, LessonProgress
from app.models.payment import Payment, Subscription, Invoice
from app.models.session import LiveSession, AttendanceConfirmation, Attendance
from app.models.exam import ExamSlot, ExamBooking
from app.models.certificate import Certificate
from app.models.holiday import Holiday
from app.models.email_log import EmailLog

# Alle Modelle für Alembic-Migrationen verfügbar machen
__all__ = [
    "User",
    "Class",
    "ClassTeacher", 
    "ClassSchedule",
    "ClassEnrollment",
    "Enrollment",
    "LessonProgress",
    "Payment",
    "Subscription",
    "Invoice",
    "LiveSession",
    "AttendanceConfirmation",
    "Attendance",
    "ExamSlot",
    "ExamBooking",
    "Certificate",
    "Holiday",
    "EmailLog",
]

