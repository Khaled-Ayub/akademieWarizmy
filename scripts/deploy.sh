#!/bin/bash
# ===========================================
# WARIZMY EDUCATION - Deployment Script
# ===========================================
# Verwendung: ./deploy.sh [staging|production]

set -e  # Bei Fehler abbrechen

# =========================================
# Konfiguration
# =========================================
ENVIRONMENT=${1:-staging}
PROJECT_DIR="/opt/warizmy-education"
BACKUP_DIR="/opt/backups/warizmy"

echo "================================================"
echo "WARIZMY EDUCATION - Deployment"
echo "Umgebung: $ENVIRONMENT"
echo "Datum: $(date)"
echo "================================================"

# =========================================
# Prüfungen
# =========================================
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Ungültige Umgebung: $ENVIRONMENT"
    echo "Verwendung: ./deploy.sh [staging|production]"
    exit 1
fi

# Prüfen ob Docker läuft
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker ist nicht gestartet"
    exit 1
fi

# =========================================
# Backup erstellen (nur Production)
# =========================================
if [ "$ENVIRONMENT" == "production" ]; then
    echo ""
    echo "📦 Erstelle Backup..."
    
    # Backup-Verzeichnis erstellen
    mkdir -p $BACKUP_DIR
    
    # Datenbank-Backup
    BACKUP_FILE="$BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql.gz"
    docker exec warizmy-postgres pg_dumpall -U warizmy | gzip > $BACKUP_FILE
    echo "✅ Datenbank-Backup erstellt: $BACKUP_FILE"
    
    # Alte Backups löschen (älter als 7 Tage)
    find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
    echo "✅ Alte Backups bereinigt"
fi

# =========================================
# Code aktualisieren
# =========================================
echo ""
echo "📥 Aktualisiere Code..."
cd $PROJECT_DIR

# Git Pull
git fetch origin
git reset --hard origin/main

echo "✅ Code aktualisiert"

# =========================================
# Docker Images bauen
# =========================================
echo ""
echo "🔨 Baue Docker Images..."

if [ "$ENVIRONMENT" == "production" ]; then
    docker-compose build --no-cache
else
    docker-compose -f docker-compose.dev.yml build --no-cache
fi

echo "✅ Images gebaut"

# =========================================
# Container neustarten
# =========================================
echo ""
echo "🔄 Starte Container neu..."

if [ "$ENVIRONMENT" == "production" ]; then
    # Container stoppen
    docker-compose down
    
    # Container starten
    docker-compose up -d
    
    # Warten bis Container bereit sind
    sleep 10
    
    # Datenbank-Migrationen ausführen
    echo "🔄 Führe Datenbank-Migrationen aus..."
    docker exec warizmy-backend alembic upgrade head
else
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up -d
fi

echo "✅ Container gestartet"

# =========================================
# Health Check
# =========================================
echo ""
echo "🏥 Health Check..."

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/api/health > /dev/null; then
        echo "✅ Backend ist bereit"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Warte auf Backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Backend Health Check fehlgeschlagen"
    docker-compose logs --tail=50 backend
    exit 1
fi

# =========================================
# Cleanup
# =========================================
echo ""
echo "🧹 Räume auf..."
docker system prune -f --volumes

# =========================================
# Fertig
# =========================================
echo ""
echo "================================================"
echo "✅ Deployment erfolgreich abgeschlossen!"
echo "================================================"
echo ""
echo "Services:"
echo "  - Frontend:  https://ac.warizmy.com"
echo "  - Backend:   https://ac.warizmy.com/api"
echo "  - Admin:     https://ac.warizmy.com/admin"
echo ""
