# ===========================================
# WARIZMY EDUCATION - Modelle Package
# ===========================================
# Zentrale Export-Datei für alle SQLAlchemy Modelle
# 
# Struktur:
# ├── user.py           → User-Modell (bleibt im Root)
# ├── course/           → Kurs-bezogene Modelle
# │   ├── course.py     → Course, CourseType, CourseCategory, etc.
# │   ├── lesson.py     → Lesson, ContentType, QuestionType
# │   └── homework.py   → Homework, HomeworkSubmission
# ├── class_/           → Klassen-Modelle  
# │   └── class_model.py → Class, ClassTeacher, ClassSchedule, ClassEnrollment
# ├── enrollment/       → Einschreibungs-Modelle
# │   └── enrollment.py → Enrollment, LessonProgress
# ├── payment/          → Zahlungs-Modelle
# │   └── payment.py    → Payment, Subscription, Invoice
# ├── session/          → Session-Modelle
# │   └── session.py    → LiveSession, AttendanceConfirmation, Attendance
# ├── exam/             → Prüfungs-Modelle
# │   └── exam.py       → ExamSlot, ExamBooking
# ├── certificate/      → Zertifikat-Modelle
# │   └── certificate.py → Certificate
# ├── content/          → Content-Modelle (Website)
# │   ├── teacher_profile.py → TeacherProfile
# │   ├── faq.py        → FAQ
# │   ├── testimonial.py → Testimonial
# │   ├── announcement.py → Announcement
# │   └── daily_guidance.py → DailyGuidance
# └── system/           → System-Modelle
#     ├── holiday.py    → Holiday
#     └── email_log.py  → EmailLog

# User (bleibt im Root-Verzeichnis)
from app.models.user import User, UserRole

# Course-Modelle
from app.models.course import (
    Course,
    CourseType,
    CourseCategory,
    CourseLevel,
    PriceType,
    course_teachers,
    Lesson,
    ContentType,
    QuestionType,
    Homework,
    HomeworkSubmission,
    SubmissionStatus,
)

# Klassen-Modelle
from app.models.class_ import (
    Class,
    ClassTeacher,
    ClassSchedule,
    ClassEnrollment,
    SessionType,
    EnrollmentStatus as ClassEnrollmentStatus,  # Umbenannt um Konflikte zu vermeiden
)

# Enrollment-Modelle
from app.models.enrollment import (
    Enrollment,
    LessonProgress,
    EnrollmentType,
    EnrollmentStatus,
)

# Payment-Modelle
from app.models.payment import (
    Payment,
    Subscription,
    Invoice,
    PaymentMethod,
    PaymentStatus,
    SubscriptionStatus,
)

# Session-Modelle
from app.models.session import (
    LiveSession,
    AttendanceConfirmation,
    Attendance,
    SessionType as LiveSessionType,  # Umbenannt um Konflikte zu vermeiden
    AttendanceStatus,
    CheckInMethod,
)

# Exam-Modelle
from app.models.exam import (
    ExamSlot,
    ExamBooking,
    ExamBookingStatus,
    ExamResult,
)

# Certificate-Modelle
from app.models.certificate import Certificate

# Content-Modelle
from app.models.content import (
    TeacherProfile,
    FAQ,
    Testimonial,
    Announcement,
    DailyGuidance,
    Weekday,
    RamadanMode,
    Location,
)

# System-Modelle
from app.models.system import (
    Holiday,
    EmailLog,
    EmailType,
    EmailStatus,
)

# Alle Modelle für Alembic-Migrationen verfügbar machen
__all__ = [
    # =========================================
    # User & Auth
    # =========================================
    "User",
    "UserRole",
    
    # =========================================
    # Course (Kurse, Lektionen, Hausaufgaben)
    # =========================================
    "Course",
    "CourseType",
    "CourseCategory",
    "CourseLevel",
    "PriceType",
    "course_teachers",
    "Lesson",
    "ContentType",
    "QuestionType",
    "Homework",
    "HomeworkSubmission",
    "SubmissionStatus",
    
    # =========================================
    # Class (Klassen)
    # =========================================
    "Class",
    "ClassTeacher",
    "ClassSchedule",
    "ClassEnrollment",
    "SessionType",
    "ClassEnrollmentStatus",
    
    # =========================================
    # Enrollment (Einschreibungen & Fortschritt)
    # =========================================
    "Enrollment",
    "LessonProgress",
    "EnrollmentType",
    "EnrollmentStatus",
    
    # =========================================
    # Payment (Zahlungen)
    # =========================================
    "Payment",
    "Subscription",
    "Invoice",
    "PaymentMethod",
    "PaymentStatus",
    "SubscriptionStatus",
    
    # =========================================
    # Session (Live-Sessions & Anwesenheit)
    # =========================================
    "LiveSession",
    "AttendanceConfirmation",
    "Attendance",
    "LiveSessionType",
    "AttendanceStatus",
    "CheckInMethod",
    
    # =========================================
    # Exam (Prüfungen)
    # =========================================
    "ExamSlot",
    "ExamBooking",
    "ExamBookingStatus",
    "ExamResult",
    
    # =========================================
    # Certificate (Zertifikate)
    # =========================================
    "Certificate",
    
    # =========================================
    # Content (Website-Inhalte)
    # =========================================
    "TeacherProfile",
    "FAQ",
    "Testimonial",
    "Announcement",
    "DailyGuidance",
    "Weekday",
    "RamadanMode",
    "Location",
    
    # =========================================
    # System (Feiertage, E-Mail-Logs)
    # =========================================
    "Holiday",
    "EmailLog",
    "EmailType",
    "EmailStatus",
]
