# ===========================================
# WARIZMY EDUCATION - API Dependencies
# ===========================================
# Gemeinsame Dependencies für alle API-Router
# (Authentifizierung, Datenbankzugriff, etc.)

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

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

