# ===========================================
# WARIZMY EDUCATION - Security Utilities
# ===========================================
# JWT-Handling, Passwort-Hashing und Auth-Hilfsfunktionen

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

# Settings laden
settings = get_settings()

# =========================================
# Passwort-Hashing mit bcrypt
# =========================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Überprüft ein Klartext-Passwort gegen einen Hash.
    
    Args:
        plain_password: Das eingegebene Passwort
        hashed_password: Der gespeicherte Hash
        
    Returns:
        True wenn das Passwort korrekt ist
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Erstellt einen bcrypt-Hash für ein Passwort.
    
    Args:
        password: Das zu hashende Passwort
        
    Returns:
        Der bcrypt-Hash
    """
    return pwd_context.hash(password)


# =========================================
# JWT Token Handling
# =========================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Erstellt einen JWT Access Token.
    
    Args:
        data: Die zu kodierenden Daten (z.B. {"sub": user_id})
        expires_delta: Optionale Gültigkeitsdauer
        
    Returns:
        Der kodierte JWT Token
    """
    to_encode = data.copy()
    
    # Ablaufzeit setzen
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    # Token erstellen
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Erstellt einen JWT Refresh Token (längere Gültigkeit).
    
    Args:
        data: Die zu kodierenden Daten
        
    Returns:
        Der kodierte Refresh Token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Dekodiert und validiert einen JWT Token.
    
    Args:
        token: Der zu dekodierende Token
        
    Returns:
        Die dekodierten Daten oder None bei ungültigem Token
    """
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None

