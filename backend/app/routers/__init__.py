# ===========================================
# WARIZMY EDUCATION - Routers Package
# ===========================================
# Alle API-Router exportieren
#
# Struktur:
# - auth.py         → Authentifizierung (Login, Register, Token)
# - users.py        → Benutzerverwaltung
# - classes.py      → Klassen/Kurse
# - enrollments.py  → Einschreibungen & Fortschritt
# - sessions.py     → Live-Sessions & Anwesenheit
# - payments.py     → Zahlungen (Stripe, PayPal)
# - exams.py        → Prüfungen & PVL
# - certificates.py → Zertifikate
# - admin.py        → Admin-Bereich
# - courses.py      → Kurse & Lektionen (Content)
# - content.py      → Lehrer, FAQs, Testimonials, etc.

from app.routers import (
    auth,
    users,
    classes,
    enrollments,
    sessions,
    payments,
    exams,
    certificates,
    admin,
    courses,
    content,
    upload,
    locations,
    homework,
)

__all__ = [
    "auth",
    "users",
    "classes",
    "enrollments",
    "sessions",
    "payments",
    "exams",
    "certificates",
    "admin",
    "courses",
    "content",
    "upload",
    "locations",
    "homework",
]
