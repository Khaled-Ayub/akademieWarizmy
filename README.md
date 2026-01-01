# WARIZMY EDUCATION

Eine Lernplattform für Arabisch und islamische Bildung mit Vor-Ort-Unterricht, Live-Streaming und Aufzeichnungen.

## Tech-Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy 2.0, Alembic
- **CMS**: Strapi v5
- **Datenbank**: PostgreSQL 16
- **Cache**: Redis
- **Storage**: MinIO (S3-kompatibel)
- **Container**: Docker + Docker Compose

## Voraussetzungen

- Docker & Docker Compose
- Node.js 20+ (für lokale Entwicklung)
- Python 3.11+ (für lokale Entwicklung)

## Schnellstart

### 1. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
# .env Datei mit eigenen Werten anpassen
```

### 2. Entwicklungsumgebung starten

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Produktionsumgebung starten

```bash
docker-compose up -d
```

## Zugriff

- **Frontend**: http://localhost:3000 (Dev) / https://ac.warizmy.com (Prod)
- **Backend API**: http://localhost:8000/api
- **Strapi Admin**: http://localhost:1337/admin
- **MinIO Console**: http://localhost:9001

## Projektstruktur

```
warizmy-education/
├── frontend/          # Next.js Frontend
├── backend/           # FastAPI Backend
├── strapi/            # Strapi CMS
├── nginx/             # Nginx Reverse Proxy
├── scripts/           # Deployment & Backup Scripts
├── docker-compose.yml # Produktion
└── docker-compose.dev.yml # Entwicklung
```

## Entwicklung

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Strapi

```bash
cd strapi
npm install
npm run develop
```

## Deployment

Siehe `scripts/deploy.sh` für automatisiertes Deployment auf Hetzner.

## Lizenz

Proprietär - Alle Rechte vorbehalten.

