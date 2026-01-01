#!/bin/bash
# ===========================================
# WARIZMY EDUCATION - Backup Script
# ===========================================
# Erstellt Backups von Datenbanken und Medien
# Sollte als Cronjob täglich ausgeführt werden:
# 0 2 * * * /opt/warizmy-education/scripts/backup.sh >> /var/log/warizmy-backup.log 2>&1

set -e  # Bei Fehler abbrechen

# =========================================
# Konfiguration
# =========================================
BACKUP_DIR="/opt/backups/warizmy"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7  # Backups für 7 Tage behalten

# Optionale B2/S3 Konfiguration für Cloud-Backup
B2_BUCKET="warizmy-backups"
USE_CLOUD_BACKUP=${USE_CLOUD_BACKUP:-false}

echo "================================================"
echo "WARIZMY EDUCATION - Backup"
echo "Datum: $(date)"
echo "================================================"

# =========================================
# Verzeichnisse erstellen
# =========================================
mkdir -p $BACKUP_DIR/database
mkdir -p $BACKUP_DIR/strapi
mkdir -p $BACKUP_DIR/minio

# =========================================
# PostgreSQL Backup (FastAPI)
# =========================================
echo ""
echo "📦 PostgreSQL Backup (FastAPI)..."

PGDUMP_FILE="$BACKUP_DIR/database/warizmy_app_$DATE.sql.gz"

docker exec warizmy-postgres-app pg_dump \
    -U warizmy \
    -d warizmy_app \
    --no-owner \
    --no-privileges \
    | gzip > $PGDUMP_FILE

echo "✅ FastAPI Datenbank gesichert: $PGDUMP_FILE"
echo "   Größe: $(du -h $PGDUMP_FILE | cut -f1)"

# =========================================
# PostgreSQL Backup (Strapi)
# =========================================
echo ""
echo "📦 PostgreSQL Backup (Strapi)..."

STRAPI_DB_FILE="$BACKUP_DIR/database/warizmy_strapi_$DATE.sql.gz"

docker exec warizmy-postgres-strapi pg_dump \
    -U warizmy \
    -d warizmy_strapi \
    --no-owner \
    --no-privileges \
    | gzip > $STRAPI_DB_FILE

echo "✅ Strapi Datenbank gesichert: $STRAPI_DB_FILE"
echo "   Größe: $(du -h $STRAPI_DB_FILE | cut -f1)"

# =========================================
# Strapi Uploads Backup
# =========================================
echo ""
echo "📦 Strapi Uploads Backup..."

STRAPI_UPLOADS_FILE="$BACKUP_DIR/strapi/uploads_$DATE.tar.gz"

docker cp warizmy-strapi:/opt/app/public/uploads - | gzip > $STRAPI_UPLOADS_FILE

echo "✅ Strapi Uploads gesichert: $STRAPI_UPLOADS_FILE"
echo "   Größe: $(du -h $STRAPI_UPLOADS_FILE | cut -f1)"

# =========================================
# MinIO Backup (PDFs, Zertifikate)
# =========================================
echo ""
echo "📦 MinIO Backup..."

MINIO_BACKUP_FILE="$BACKUP_DIR/minio/minio_$DATE.tar.gz"

# MinIO Daten sichern
docker cp warizmy-minio:/data - | gzip > $MINIO_BACKUP_FILE

echo "✅ MinIO Daten gesichert: $MINIO_BACKUP_FILE"
echo "   Größe: $(du -h $MINIO_BACKUP_FILE | cut -f1)"

# =========================================
# Alte Backups löschen
# =========================================
echo ""
echo "🧹 Lösche alte Backups (älter als $KEEP_DAYS Tage)..."

find $BACKUP_DIR -name "*.gz" -mtime +$KEEP_DAYS -delete

echo "✅ Alte Backups bereinigt"

# =========================================
# Cloud-Backup (optional)
# =========================================
if [ "$USE_CLOUD_BACKUP" = true ]; then
    echo ""
    echo "☁️ Lade Backups in Cloud hoch..."
    
    # B2 CLI verwenden (muss installiert sein)
    if command -v b2 &> /dev/null; then
        b2 sync $BACKUP_DIR b2://$B2_BUCKET/
        echo "✅ Cloud-Backup abgeschlossen"
    else
        echo "⚠️ B2 CLI nicht installiert, Cloud-Backup übersprungen"
    fi
fi

# =========================================
# Statistiken
# =========================================
echo ""
echo "================================================"
echo "Backup abgeschlossen!"
echo "================================================"
echo ""
echo "Backup-Verzeichnis: $BACKUP_DIR"
echo "Gesamtgröße: $(du -sh $BACKUP_DIR | cut -f1)"
echo ""
echo "Dateien:"
ls -lh $BACKUP_DIR/database/*$DATE* 2>/dev/null || true
ls -lh $BACKUP_DIR/strapi/*$DATE* 2>/dev/null || true
ls -lh $BACKUP_DIR/minio/*$DATE* 2>/dev/null || true
echo ""

