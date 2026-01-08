# ===========================================
# WARIZMY EDUCATION - Auth Router
# ===========================================
# Authentifizierungs-Endpunkte (Login, Register, Password Reset)

from datetime import datetime, timedelta, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import secrets

from app.db.session import get_db
from app.core.config import get_settings
from app.models.user import User, UserRole

# Settings & Router
settings = get_settings()
router = APIRouter()

# =========================================
# Passwort-Hashing
# =========================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# =========================================
# OAuth2 Schema für Token
# =========================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# =========================================
# Pydantic Schemas
# =========================================
class UserCreate(BaseModel):
    """Schema für Benutzerregistrierung"""
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None


class UserResponse(BaseModel):
    """Schema für Benutzer-Antwort"""
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    date_of_birth: Optional[date] = None
    newsletter_opt_in: bool = False
    whatsapp_opt_in: bool = False
    whatsapp_channel_opt_in: bool = False
    onboarding_completed: bool = False
    profile_picture_url: Optional[str] = None
    role: str
    is_active: bool
    email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema für JWT Token"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema für dekodierte Token-Daten"""
    user_id: Optional[str] = None


class PasswordReset(BaseModel):
    """Schema für Passwort-Zurücksetzung"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema für Passwort-Zurücksetzung Bestätigung"""
    token: str
    new_password: str


class LoginResponse(BaseModel):
    """Schema für Login-Antwort"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


# =========================================
# Helper-Funktionen
# =========================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Überprüft, ob das Passwort korrekt ist"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Erstellt einen Passwort-Hash"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Erstellt einen JWT Access Token.
    
    Args:
        data: Daten, die im Token gespeichert werden
        expires_delta: Gültigkeitsdauer (Standard: 30 Minuten)
    
    Returns:
        JWT Token als String
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
    Erstellt einen JWT Refresh Token.
    
    Args:
        data: Daten, die im Token gespeichert werden
    
    Returns:
        JWT Token als String
    """
    to_encode = data.copy()
    
    # Ablaufzeit setzen (7 Tage)
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    # Token erstellen
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET, 
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Benutzer anhand der E-Mail-Adresse abrufen"""
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency: Aktuellen Benutzer aus JWT Token abrufen.
    
    Wird in geschützten Routen verwendet:
        @router.get("/me")
        async def get_me(user: User = Depends(get_current_user)):
            ...
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Ungültige Anmeldedaten",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Token dekodieren
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Benutzer aus Datenbank laden
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Benutzer ist deaktiviert"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency: Aktuellen aktiven Benutzer abrufen"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Benutzer ist deaktiviert"
        )
    return current_user


def require_role(*roles: UserRole):
    """
    Dependency Factory: Prüft ob Benutzer bestimmte Rolle hat.
    
    Verwendung:
        @router.get("/admin-only")
        async def admin_only(user: User = Depends(require_role(UserRole.ADMIN))):
            ...
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Keine Berechtigung für diese Aktion"
            )
        return current_user
    
    return role_checker


# =========================================
# API Endpunkte
# =========================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Neuen Benutzer registrieren.
    
    - Prüft ob E-Mail bereits existiert
    - Erstellt Benutzer mit gehashtem Passwort
    - Sendet Willkommens-E-Mail (im Hintergrund)
    """
    # Prüfen ob E-Mail bereits existiert
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-Mail-Adresse bereits registriert"
        )
    
    # Passwort hashen
    hashed_password = get_password_hash(user_data.password)
    
    # Neuen Benutzer erstellen
    new_user = User(
        email=user_data.email.lower(),
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=UserRole.STUDENT,  # Standardrolle
        is_active=True,
        email_verified=False,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # TODO: Willkommens-E-Mail senden (Background Task)
    # background_tasks.add_task(send_welcome_email, new_user.email, new_user.first_name)
    
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        phone=new_user.phone,
        date_of_birth=new_user.date_of_birth,
        newsletter_opt_in=new_user.newsletter_opt_in,
        whatsapp_opt_in=new_user.whatsapp_opt_in,
        whatsapp_channel_opt_in=new_user.whatsapp_channel_opt_in,
        onboarding_completed=new_user.onboarding_completed,
        role=new_user.role.value,
        is_active=new_user.is_active,
        email_verified=new_user.email_verified,
        created_at=new_user.created_at,
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Benutzer anmelden und JWT Tokens erhalten.
    
    - Verwendet OAuth2 Password Flow
    - Gibt Access Token und Refresh Token zurück
    """
    # Benutzer suchen
    user = await get_user_by_email(db, form_data.username.lower())
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige E-Mail oder Passwort",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Passwort prüfen
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige E-Mail oder Passwort",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Prüfen ob Benutzer aktiv ist
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Benutzer ist deaktiviert"
        )
    
    # Tokens erstellen
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            date_of_birth=user.date_of_birth,
            newsletter_opt_in=user.newsletter_opt_in,
            whatsapp_opt_in=user.whatsapp_opt_in,
            whatsapp_channel_opt_in=user.whatsapp_channel_opt_in,
            onboarding_completed=user.onboarding_completed,
            role=user.role.value,
            is_active=user.is_active,
            email_verified=user.email_verified,
            created_at=user.created_at,
        )
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Access Token mit Refresh Token erneuern.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Ungültiger Refresh Token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Token dekodieren
        payload = jwt.decode(
            refresh_token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "refresh":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Benutzer prüfen
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    # Neue Tokens erstellen
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Aktuellen angemeldeten Benutzer abrufen.
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        date_of_birth=current_user.date_of_birth,
        newsletter_opt_in=current_user.newsletter_opt_in,
        whatsapp_opt_in=current_user.whatsapp_opt_in,
        whatsapp_channel_opt_in=current_user.whatsapp_channel_opt_in,
        onboarding_completed=current_user.onboarding_completed,
        profile_picture_url=getattr(current_user, 'profile_picture_url', None),
        role=current_user.role.value,
        is_active=current_user.is_active,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at,
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    data: PasswordReset,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Passwort-Zurücksetzung anfordern.
    
    Sendet eine E-Mail mit Reset-Link (wenn E-Mail existiert).
    Gibt immer 200 zurück (Sicherheit: keine Info ob E-Mail existiert).
    """
    user = await get_user_by_email(db, data.email.lower())
    
    if user:
        # Reset-Token erstellen (gültig für 1 Stunde)
        reset_token = create_access_token(
            data={"sub": str(user.id), "type": "password_reset"},
            expires_delta=timedelta(hours=1)
        )
        
        # TODO: E-Mail mit Reset-Link senden
        # background_tasks.add_task(
        #     send_password_reset_email, 
        #     user.email, 
        #     reset_token
        # )
    
    # Immer gleiche Antwort (Sicherheit)
    return {"message": "Falls die E-Mail existiert, wurde ein Reset-Link gesendet."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """
    Passwort mit Reset-Token zurücksetzen.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Ungültiger oder abgelaufener Token"
    )
    
    try:
        # Token dekodieren
        payload = jwt.decode(
            data.token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "password_reset":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Benutzer laden
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise credentials_exception
    
    # Neues Passwort setzen
    user.password_hash = get_password_hash(data.new_password)
    await db.commit()
    
    return {"message": "Passwort erfolgreich geändert"}


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Benutzer abmelden.
    
    Bei JWT gibt es kein echtes Logout - der Token ist gültig bis er abläuft.
    Client sollte den Token löschen.
    
    Für echte Invalidierung wäre eine Token-Blacklist (Redis) nötig.
    """
    # TODO: Token zur Blacklist hinzufügen (Redis)
    return {"message": "Erfolgreich abgemeldet"}

