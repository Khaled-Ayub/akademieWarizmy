# 🚀 WARIZMY Academy - Deployment Guide

## Übersicht

| Service | Plattform | Domain |
|---------|-----------|--------|
| Backend (FastAPI) | Railway | `acbackend.warizmyacademy.de` |
| Frontend (Next.js) | Vercel | `ac.warizmyacademy.de` |
| Datenbank | Railway PostgreSQL | - |
| Redis | Railway Redis | - |
| Storage | MinIO/S3 | - |

---

## 📦 1. Voraussetzungen

### CLI Tools installieren

```bash
# Railway CLI
npm install -g @railway/cli

# Vercel CLI
npm install -g vercel
```

### Logins

```bash
# Railway Login
railway login

# Vercel Login
vercel login
```

---

## 🔧 2. Backend auf Railway deployen

### Schritt 1: Railway Projekt erstellen

```bash
cd backend

# Neues Projekt erstellen
railway init

# Oder existierendes Projekt verknüpfen
railway link
```

### Schritt 2: PostgreSQL & Redis hinzufügen

Im Railway Dashboard:
1. "New Service" → "Database" → "PostgreSQL"
2. "New Service" → "Database" → "Redis"

Oder per CLI:
```bash
railway add --database postgres
railway add --database redis
```

### Schritt 3: Environment Variables setzen

```bash
railway variables set DATABASE_URL="${{Postgres.DATABASE_URL}}"
railway variables set REDIS_URL="${{Redis.REDIS_URL}}"
railway variables set SECRET_KEY="dein-geheimer-schluessel-min-32-zeichen"
railway variables set JWT_SECRET_KEY="jwt-geheimer-schluessel-min-32-zeichen"
railway variables set ANTHROPIC_API_KEY="sk-ant-..."
railway variables set CORS_ORIGINS="https://ac.warizmyacademy.de,http://localhost:3000"
railway variables set MINIO_ENDPOINT="dein-minio-endpoint"
railway variables set MINIO_ACCESS_KEY="dein-access-key"
railway variables set MINIO_SECRET_KEY="dein-secret-key"
railway variables set MINIO_BUCKET="warizmy-uploads"
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
railway variables set MAIL_SERVER="smtp.gmail.com"
railway variables set MAIL_PORT="587"
railway variables set MAIL_USERNAME="noreply@warizmyacademy.de"
railway variables set MAIL_PASSWORD="app-passwort"
railway variables set MAIL_FROM="noreply@warizmyacademy.de"
```

### Schritt 4: Deployment

```bash
# Backend-Verzeichnis
cd backend

# Deployen
railway up

# Logs überprüfen
railway logs
```

### Schritt 5: Custom Domain

1. Im Railway Dashboard → Service → Settings → Domains
2. "Add Custom Domain" klicken
3. `acbackend.warizmyacademy.de` eingeben
4. DNS CNAME Record erstellen (siehe unten)

---

## 🌐 3. Frontend auf Vercel deployen

### Schritt 1: Vercel Projekt erstellen

```bash
cd frontend

# Vercel Projekt initialisieren
vercel

# Prompts beantworten:
# - Link to existing project? → No
# - Project name → warizmy-academy-frontend
# - Framework → Next.js
# - Build settings → Default
```

### Schritt 2: Environment Variables setzen

```bash
vercel env add NEXT_PUBLIC_API_URL
# Wert: https://acbackend.warizmyacademy.de/api

vercel env add API_INTERNAL_URL
# Wert: https://acbackend.warizmyacademy.de/api
```

Oder im Vercel Dashboard:
1. Settings → Environment Variables
2. Hinzufügen:
   - `NEXT_PUBLIC_API_URL` = `https://acbackend.warizmyacademy.de/api`
   - `API_INTERNAL_URL` = `https://acbackend.warizmyacademy.de/api`

### Schritt 3: Production Deployment

```bash
# Production Build deployen
vercel --prod
```

### Schritt 4: Custom Domain

1. Im Vercel Dashboard → Project → Settings → Domains
2. "Add" klicken
3. `ac.warizmyacademy.de` eingeben
4. DNS Records erstellen (siehe unten)

---

## 🔗 4. DNS Konfiguration

Bei deinem Domain-Anbieter folgende Records erstellen:

### Backend (Railway)
```
Type: CNAME
Name: acbackend
Value: [Railway-Domain aus Dashboard]
TTL: 3600
```

### Frontend (Vercel)
```
Type: CNAME
Name: ac
Value: cname.vercel-dns.com
TTL: 3600

# Alternativ A-Record:
Type: A
Name: ac
Value: 76.76.21.21
TTL: 3600
```

---

## 📋 5. Environment Variables Übersicht

### Backend (Railway)

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://...` |
| `REDIS_URL` | Redis Connection String | `redis://...` |
| `SECRET_KEY` | App Secret (32+ Zeichen) | `super-secret-key...` |
| `JWT_SECRET_KEY` | JWT Secret (32+ Zeichen) | `jwt-secret-key...` |
| `JWT_ALGORITHM` | JWT Algorithmus | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token Gültigkeit | `30` |
| `ANTHROPIC_API_KEY` | Anthropic API Key | `sk-ant-...` |
| `CORS_ORIGINS` | Erlaubte Origins | `https://ac.warizmyacademy.de` |
| `MINIO_ENDPOINT` | MinIO/S3 Endpoint | `s3.eu-central-1.amazonaws.com` |
| `MINIO_ACCESS_KEY` | S3 Access Key | `AKIA...` |
| `MINIO_SECRET_KEY` | S3 Secret Key | `...` |
| `MINIO_BUCKET` | S3 Bucket Name | `warizmy-uploads` |
| `MINIO_USE_SSL` | SSL verwenden | `true` |
| `STRIPE_SECRET_KEY` | Stripe Secret | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | `whsec_...` |
| `MAIL_SERVER` | SMTP Server | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP Port | `587` |
| `MAIL_USERNAME` | SMTP User | `noreply@warizmyacademy.de` |
| `MAIL_PASSWORD` | SMTP Passwort | `app-passwort` |
| `MAIL_FROM` | Absender E-Mail | `noreply@warizmyacademy.de` |

### Frontend (Vercel)

| Variable | Beschreibung | Wert |
|----------|--------------|------|
| `NEXT_PUBLIC_API_URL` | Öffentliche API URL | `https://acbackend.warizmyacademy.de/api` |
| `API_INTERNAL_URL` | Interne API URL | `https://acbackend.warizmyacademy.de/api` |

---

## 🔄 6. Automatische Deployments (GitHub Integration)

### Railway

1. Railway Dashboard → Service → Settings → Source
2. "Connect GitHub Repo" klicken
3. Repository `Khaled-Ayub/akademieWarizmy` auswählen
4. Branch: `main`
5. Root Directory: `backend`
6. ✅ Automatic Deploys aktivieren

### Vercel

1. Vercel Dashboard → Project → Settings → Git
2. "Connect Git Repository" klicken
3. Repository `Khaled-Ayub/akademieWarizmy` auswählen
4. Root Directory: `frontend`
5. ✅ Auto-Deploy aktiviert (Standard)

---

## 🛠️ 7. Nützliche Befehle

### Railway

```bash
# Status prüfen
railway status

# Logs anzeigen
railway logs

# Shell im Container
railway shell

# Environment Variables anzeigen
railway variables

# Redeploy
railway up --detach
```

### Vercel

```bash
# Status prüfen
vercel ls

# Logs anzeigen
vercel logs

# Environment anzeigen
vercel env ls

# Redeploy (ohne Cache)
vercel --prod --force
```

---

## 🐛 8. Troubleshooting

### Backend startet nicht

```bash
# Logs prüfen
railway logs

# Häufige Ursachen:
# - DATABASE_URL fehlt
# - Port nicht auf $PORT gesetzt
# - Python-Abhängigkeiten fehlen
```

### Frontend 500 Errors

```bash
# Build-Logs prüfen
vercel logs

# Häufige Ursachen:
# - API_URL falsch konfiguriert
# - CORS nicht erlaubt
# - API nicht erreichbar
```

### CORS Probleme

Backend `CORS_ORIGINS` muss die Frontend-Domain enthalten:
```
CORS_ORIGINS=https://ac.warizmyacademy.de,http://localhost:3000
```

### Datenbank Migration

```bash
# Railway Shell öffnen
railway shell

# Alembic Migrationen ausführen
alembic upgrade head
```

---

## 📱 9. Nach dem Deployment

### Health Check

```bash
# Backend Health
curl https://acbackend.warizmyacademy.de/api/health

# Frontend
curl https://ac.warizmyacademy.de
```

### Admin-Benutzer erstellen

```bash
# Railway Shell
railway shell

# Python Script ausführen
python -c "
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import asyncio

async def create_admin():
    async with AsyncSessionLocal() as session:
        admin = User(
            email='admin@warizmyacademy.de',
            hashed_password=get_password_hash('dein-sicheres-passwort'),
            full_name='Admin',
            role='admin',
            is_active=True
        )
        session.add(admin)
        await session.commit()
        print('Admin erstellt!')

asyncio.run(create_admin())
"
```

---

## ✅ Checkliste

- [ ] Railway Account erstellt
- [ ] Vercel Account erstellt
- [ ] GitHub Repository aktuell
- [ ] Backend auf Railway deployed
- [ ] PostgreSQL auf Railway hinzugefügt
- [ ] Redis auf Railway hinzugefügt (optional)
- [ ] Backend Environment Variables gesetzt
- [ ] Backend Custom Domain konfiguriert
- [ ] Frontend auf Vercel deployed
- [ ] Frontend Environment Variables gesetzt
- [ ] Frontend Custom Domain konfiguriert
- [ ] DNS Records erstellt
- [ ] SSL Zertifikate aktiv (automatisch)
- [ ] Health Checks bestanden
- [ ] Admin-Benutzer erstellt

