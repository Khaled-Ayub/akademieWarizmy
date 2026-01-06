# ===========================================
# WARIZMY EDUCATION - Admin-Benutzer erstellen
# ===========================================
# Einmaliges Skript zum Erstellen eines Admin-Benutzers
# 
# Ausführung lokal:
#   cd backend
#   python -m app.seeds.create_admin
#
# Ausführung in Railway:
#   railway run python -m app.seeds.create_admin

import asyncio
import os
import sys

# Pfad zum Backend-Verzeichnis hinzufügen
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import select
from passlib.context import CryptContext

from app.db.session import AsyncSessionLocal, init_db
from app.models.user import User, UserRole

# Passwort-Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# =========================================
# Admin-Konfiguration - HIER ANPASSEN!
# =========================================
ADMIN_EMAIL = "admin@warizmyacademy.de"
ADMIN_PASSWORD = "Warizmy2024!"  # Bitte nach dem ersten Login ändern!
ADMIN_FIRST_NAME = "Admin"
ADMIN_LAST_NAME = "Warizmy"
ADMIN_PHONE = None


async def create_admin():
    """
    Erstellt einen Admin-Benutzer in der Datenbank.
    
    - Prüft ob Admin bereits existiert
    - Erstellt neuen Admin falls nicht vorhanden
    - Aktualisiert bestehenden Benutzer zu Admin falls E-Mail existiert
    """
    print("=" * 50)
    print("WARIZMY Education - Admin erstellen")
    print("=" * 50)
    
    # Datenbank initialisieren
    print("\n📦 Verbinde mit Datenbank...")
    await init_db()
    
    async with AsyncSessionLocal() as session:
        # Prüfen ob Benutzer bereits existiert
        print(f"\n🔍 Suche nach: {ADMIN_EMAIL}")
        
        result = await session.execute(
            select(User).where(User.email == ADMIN_EMAIL.lower())
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            if existing_user.role == UserRole.ADMIN:
                print(f"\n✅ Admin-Benutzer existiert bereits!")
                print(f"   E-Mail: {existing_user.email}")
                print(f"   Name: {existing_user.full_name}")
                print(f"   Rolle: {existing_user.role.value}")
                return
            else:
                # Benutzer existiert, aber ist kein Admin -> upgraden
                print(f"\n🔄 Benutzer existiert, upgrade zu Admin...")
                existing_user.role = UserRole.ADMIN
                existing_user.is_active = True
                existing_user.email_verified = True
                await session.commit()
                print(f"\n✅ Benutzer zu Admin upgegraded!")
                print(f"   E-Mail: {existing_user.email}")
                print(f"   Name: {existing_user.full_name}")
                return
        
        # Neuen Admin erstellen
        print("\n👤 Erstelle neuen Admin-Benutzer...")
        
        hashed_password = pwd_context.hash(ADMIN_PASSWORD)
        
        admin_user = User(
            email=ADMIN_EMAIL.lower(),
            password_hash=hashed_password,
            first_name=ADMIN_FIRST_NAME,
            last_name=ADMIN_LAST_NAME,
            phone=ADMIN_PHONE,
            role=UserRole.ADMIN,
            is_active=True,
            email_verified=True,
        )
        
        session.add(admin_user)
        await session.commit()
        await session.refresh(admin_user)
        
        print("\n" + "=" * 50)
        print("✅ ADMIN ERFOLGREICH ERSTELLT!")
        print("=" * 50)
        print(f"\n   📧 E-Mail:    {ADMIN_EMAIL}")
        print(f"   🔑 Passwort:  {ADMIN_PASSWORD}")
        print(f"   👤 Name:      {ADMIN_FIRST_NAME} {ADMIN_LAST_NAME}")
        print(f"   🎭 Rolle:     admin")
        print("\n⚠️  WICHTIG: Bitte ändere das Passwort nach dem ersten Login!")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(create_admin())

