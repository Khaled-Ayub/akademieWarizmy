# ===========================================
# WARIZMY EDUCATION - API Dependencies
# ===========================================
# Gemeinsame Dependencies für alle API-Router
# (Authentifizierung, Datenbankzugriff, etc.)

from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.models.class_.class_model import Class, ClassEnrollment, class_courses
from app.models.enrollment.enrollment import Enrollment, EnrollmentStatus
from app.models.course.course import Course

# =========================================
# Security Schema (Bearer Token)
# =========================================
security = HTTPBearer(auto_error=False)


# =========================================
# Aktuellen Benutzer abrufen
# =========================================
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extrahiert und validiert den aktuellen Benutzer aus dem JWT Token.
    
    Verwendung:
        @router.get("/me")
        async def get_me(user: User = Depends(get_current_user)):
            return user
            
    Raises:
        HTTPException 401: Wenn kein/ungültiger Token
        HTTPException 404: Wenn Benutzer nicht existiert
    """
    # Prüfen ob Token vorhanden
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nicht authentifiziert",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Token dekodieren
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger oder abgelaufener Token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Token-Typ prüfen (muss Access Token sein)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger Token-Typ",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Benutzer-ID aus Token extrahieren
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger Token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Benutzer aus Datenbank laden
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden",
        )
    
    # Prüfen ob Benutzer aktiv
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Benutzer ist deaktiviert",
        )
    
    return user


# =========================================
# Optionaler Benutzer (für öffentliche Routen)
# =========================================
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Wie get_current_user, aber gibt None zurück statt Exception.
    Nützlich für Routen die sowohl anonym als auch authentifiziert funktionieren.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


# =========================================
# Rollen-Check Factory
# =========================================
def require_role(*roles: UserRole):
    """
    Factory für Rollen-basierte Zugriffskontrolle.
    
    Verwendung:
        @router.get("/admin")
        async def admin_only(user: User = Depends(require_role(UserRole.ADMIN))):
            return {"message": "Willkommen, Admin!"}
            
        @router.get("/staff")
        async def staff_or_admin(
            user: User = Depends(require_role(UserRole.ADMIN, UserRole.TEACHER))
        ):
            return {"message": "Willkommen!"}
    """
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Zugriff verweigert. Erforderliche Rolle(n): {', '.join(r.value for r in roles)}",
            )
        return user
    
    return role_checker


# =========================================
# Convenience Dependencies
# =========================================
# Häufig verwendete Rollen-Checks als fertige Dependencies

async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Nur Admins erlaubt."""
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren haben Zugriff",
        )
    return user


async def require_teacher(user: User = Depends(get_current_user)) -> User:
    """Nur Lehrer oder Admins erlaubt."""
    if user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Lehrer haben Zugriff",
        )
    return user


# =========================================
# Kurs-Zugriffskontrolle
# =========================================
async def check_course_access(
    user_id: str,
    course_id: str,
    db: AsyncSession
) -> bool:
    """
    Prüft ob ein User Zugriff auf einen Kurs hat.
    
    Zugriff besteht wenn:
    1. User direkt im Kurs eingeschrieben ist (Enrollment)
    2. User in einer Klasse ist, die dem Kurs zugeordnet ist
       - Über course_id (Legacy)
       - Über class_courses Many-to-Many
    
    Returns:
        True wenn Zugriff erlaubt, False sonst
    """
    # 1. Direkte Kurs-Einschreibung prüfen
    direct_enrollment = await db.execute(
        select(Enrollment)
        .where(Enrollment.user_id == user_id)
        .where(Enrollment.course_id == course_id)
        .where(Enrollment.status == EnrollmentStatus.ACTIVE)
    )
    if direct_enrollment.scalar_one_or_none():
        return True
    
    # 2. Klassen-Einschreibung prüfen (Legacy: course_id)
    class_enrollment_legacy = await db.execute(
        select(ClassEnrollment)
        .join(Class, ClassEnrollment.class_id == Class.id)
        .where(ClassEnrollment.user_id == user_id)
        .where(Class.course_id == course_id)
        .where(ClassEnrollment.status == "active")
    )
    if class_enrollment_legacy.scalar_one_or_none():
        return True
    
    # 3. Klassen-Einschreibung prüfen (Many-to-Many: class_courses)
    class_enrollment_m2m = await db.execute(
        select(ClassEnrollment)
        .join(Class, ClassEnrollment.class_id == Class.id)
        .join(class_courses, Class.id == class_courses.c.class_id)
        .where(ClassEnrollment.user_id == user_id)
        .where(class_courses.c.course_id == course_id)
        .where(ClassEnrollment.status == "active")
    )
    if class_enrollment_m2m.scalar_one_or_none():
        return True
    
    return False


async def get_user_courses(
    user_id: str,
    db: AsyncSession
) -> List[str]:
    """
    Gibt alle Kurs-IDs zurück, auf die ein User Zugriff hat.
    
    Kombiniert:
    - Direkte Einschreibungen (Enrollments)
    - Klassen-Einschreibungen (Legacy course_id)
    - Klassen-Einschreibungen (Many-to-Many class_courses)
    """
    course_ids = set()
    
    # 1. Direkte Einschreibungen
    direct_result = await db.execute(
        select(Enrollment.course_id)
        .where(Enrollment.user_id == user_id)
        .where(Enrollment.status == EnrollmentStatus.ACTIVE)
    )
    for row in direct_result:
        course_ids.add(str(row[0]))
    
    # 2. Klassen mit Legacy course_id
    class_legacy_result = await db.execute(
        select(Class.course_id)
        .join(ClassEnrollment, Class.id == ClassEnrollment.class_id)
        .where(ClassEnrollment.user_id == user_id)
        .where(ClassEnrollment.status == "active")
        .where(Class.course_id.isnot(None))
    )
    for row in class_legacy_result:
        if row[0]:
            course_ids.add(str(row[0]))
    
    # 3. Klassen mit Many-to-Many courses
    class_m2m_result = await db.execute(
        select(class_courses.c.course_id)
        .join(Class, class_courses.c.class_id == Class.id)
        .join(ClassEnrollment, Class.id == ClassEnrollment.class_id)
        .where(ClassEnrollment.user_id == user_id)
        .where(ClassEnrollment.status == "active")
    )
    for row in class_m2m_result:
        course_ids.add(str(row[0]))
    
    return list(course_ids)

