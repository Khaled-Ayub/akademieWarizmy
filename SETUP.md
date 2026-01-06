# 🚀 WARIZMY Education - Setup-Anleitung

Diese Anleitung führt dich Schritt für Schritt durch die Einrichtung des Projekts.

---

## 📋 Voraussetzungen

Stelle sicher, dass folgende Software installiert ist:

| Software | Version | Download |
|----------|---------|----------|
| **Docker Desktop** | 4.0+ | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org/) (optional, für lokale Entwicklung) |
| **Python** | 3.11+ | [python.org](https://www.python.org/) (optional, für lokale Entwicklung) |
| **Git** | 2.0+ | [git-scm.com](https://git-scm.com/) |

---

## 🐳 Option 1: Mit Docker starten (Empfohlen)

### Schritt 1: Repository klonen

```bash
git clone <dein-repo-url>
cd warizmy-education
```

### Schritt 2: Umgebungsvariablen einrichten

```bash
# Kopiere die Beispiel-Datei
cp env.example .env
```

Für die **Entwicklung** sind keine Änderungen nötig - die Docker-Compose-Datei enthält bereits alle Entwicklungs-Credentials.

### Schritt 3: Docker-Container starten

```bash
# Alle Services starten (PostgreSQL, Redis, MinIO, Backend, Frontend)
docker-compose -f docker-compose.dev.yml up -d
```

### Schritt 4: Logs überprüfen

```bash
# Alle Logs anzeigen
docker-compose -f docker-compose.dev.yml logs -f

# Nur Backend-Logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Nur Frontend-Logs
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Schritt 5: Anwendung öffnen

| Service | URL |
|---------|-----|
| 🌐 **Frontend** | [http://localhost:3002](http://localhost:3002) |
| ⚡ **Backend API** | [http://localhost:8000/api](http://localhost:8000/api) |
| 📚 **API Docs (Swagger)** | [http://localhost:8000/api/docs](http://localhost:8000/api/docs) |
| 🗄️ **MinIO Console** | [http://localhost:9001](http://localhost:9001) |

**MinIO Login:**
- User: `minioadmin`
- Password: `minioadmin123`

### Container stoppen

```bash
docker-compose -f docker-compose.dev.yml down
```

### Container mit Volumes löschen (Datenbank zurücksetzen)

```bash
docker-compose -f docker-compose.dev.yml down -v
```

---

## 💻 Option 2: Lokale Entwicklung (ohne Docker)

### Backend einrichten

```bash
# In das Backend-Verzeichnis wechseln
cd backend

# Virtuelle Umgebung erstellen
python -m venv venv

# Virtuelle Umgebung aktivieren
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Abhängigkeiten installieren
pip install -r requirements.txt

# Umgebungsvariablen setzen (PowerShell)
$env:DATABASE_URL = "postgresql://warizmy:warizmy_dev_password@localhost:5432/warizmy_education"
$env:JWT_SECRET = "dev_jwt_secret_change_in_production"
$env:DEBUG = "true"

# Server starten
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend einrichten

```bash
# In das Frontend-Verzeichnis wechseln
cd frontend

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen setzen (erstelle .env.local)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# Entwicklungsserver starten
npm run dev
```

**Hinweis:** Für die lokale Entwicklung müssen PostgreSQL, Redis und MinIO separat laufen (z.B. über Docker):

```bash
# Nur Datenbanken starten
docker-compose -f docker-compose.dev.yml up -d postgres redis minio
```

---

## 🛠️ Nützliche Befehle

### Docker

```bash
# Container-Status anzeigen
docker-compose -f docker-compose.dev.yml ps

# In Container einsteigen
docker exec -it warizmy-dev-backend bash
docker exec -it warizmy-dev-frontend sh

# Container neu bauen
docker-compose -f docker-compose.dev.yml build --no-cache

# Einzelnen Service neu starten
docker-compose -f docker-compose.dev.yml restart backend
```

### Datenbank

```bash
# PostgreSQL CLI öffnen
docker exec -it warizmy-dev-postgres psql -U warizmy -d warizmy_education

# Alle Tabellen anzeigen
\dt

# Tabellen-Inhalt anzeigen
SELECT * FROM users;

# Datenbank-Verbindung testen
docker exec -it warizmy-dev-postgres pg_isready -U warizmy -d warizmy_education
```

### Backend

```bash
# API testen (Health Check)
curl http://localhost:8000/api/health

# Kurse abrufen
curl http://localhost:8000/api/courses
```

---

## 📁 Projektstruktur

```
warizmy-education/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── main.py         # Einstiegspunkt
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── routers/        # API Endpoints
│   │   ├── schemas/        # Pydantic Schemas
│   │   └── services/       # Business Logic
│   ├── requirements.txt
│   └── Dockerfile.dev
│
├── frontend/               # Next.js Frontend
│   ├── app/               # App Router (Seiten)
│   │   ├── (auth)/        # Login/Register
│   │   ├── (portal)/      # Dashboard
│   │   ├── admin/         # Admin-Bereich
│   │   └── kurse/         # Kurs-Seiten
│   ├── components/        # UI-Komponenten
│   ├── lib/               # Hilfsfunktionen
│   └── package.json
│
├── docker-compose.dev.yml  # Entwicklungs-Config
├── docker-compose.yml      # Produktions-Config
└── env.example            # Umgebungsvariablen-Template
```

---

## 🔧 Troubleshooting

### Problem: Port bereits belegt

```bash
# Windows - Prozess auf Port finden
netstat -ano | findstr :3002
netstat -ano | findstr :8000

# Prozess beenden (PID ersetzen)
taskkill /PID <PID> /F
```

### Problem: Docker Container startet nicht

```bash
# Logs prüfen
docker-compose -f docker-compose.dev.yml logs backend

# Container komplett neu bauen
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

### Problem: Datenbank-Verbindung fehlgeschlagen

```bash
# Prüfen ob PostgreSQL läuft
docker-compose -f docker-compose.dev.yml ps postgres

# PostgreSQL-Logs prüfen
docker-compose -f docker-compose.dev.yml logs postgres

# Manuell verbinden
docker exec -it warizmy-dev-postgres psql -U warizmy -d warizmy_education
```

### Problem: Frontend zeigt keine Kurse an

1. Prüfe ob Backend läuft: [http://localhost:8000/api/health](http://localhost:8000/api/health)
2. Prüfe die Kurse-API: [http://localhost:8000/api/courses](http://localhost:8000/api/courses)
3. Füge Kurse im Admin-Bereich hinzu: [http://localhost:3002/admin/kurse](http://localhost:3002/admin/kurse)

### Problem: MinIO "Access Denied"

```bash
# MinIO-Container neu starten
docker-compose -f docker-compose.dev.yml restart minio

# MinIO-Konsole öffnen und Bucket erstellen
# URL: http://localhost:9001
# Login: minioadmin / minioadmin123
# Erstelle Bucket: "warizmy-uploads"
```

---

## 🎯 Erste Schritte nach dem Setup

1. **Admin-Benutzer erstellen**
   - Registriere einen Benutzer unter `/registrieren`
   - Setze die Rolle in der Datenbank auf `admin`:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'deine@email.de';
   ```

2. **Kurse anlegen**
   - Gehe zu [http://localhost:3002/admin/kurse](http://localhost:3002/admin/kurse)
   - Klicke auf "Neuer Kurs"

3. **Lehrer hinzufügen**
   - Erstelle Lehrer-Profile im Admin-Bereich

4. **Seite testen**
   - Öffne [http://localhost:3002](http://localhost:3002)
   - Prüfe alle Seiten und Funktionen

---

## 📞 Support

Bei Fragen oder Problemen:
- Erstelle ein Issue im Repository
- Kontaktiere das Entwicklerteam

---

**Viel Erfolg! 🎉**

