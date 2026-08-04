#!/bin/bash
DEST="$HOME/backups/registro20"
LOG="$DEST/backup.log"
FECHA=$(date +%F_%H-%M)
ARCHIVO="$DEST/registro20_${FECHA}.sql"
RETENER=14

PG_USER="postgres"
PG_DB="registro2"

mkdir -p "$DEST"
echo "[$(date '+%a %d %b %Y %T %Z')] Starting backup -> $ARCHIVO" >> "$LOG"

if docker exec registro_postgres pg_dump -U "$PG_USER" -d "$PG_DB" > "$ARCHIVO" 2>>"$LOG"; then
    TAM=$(du -h "$ARCHIVO" | cut -f1)
    echo "[$(date '+%a %d %b %Y %T %Z')] Backup successful. Size: $TAM" >> "$LOG"
else
    echo "[$(date '+%a %d %b %Y %T %Z')] Backup FAILED" >> "$LOG"
    rm -f "$ARCHIVO"
    exit 1
fi

find "$DEST" -name 'registro20_*.sql' -mtime +$RETENER -delete
COUNT=$(ls -1 "$DEST"/registro20_*.sql 2>/dev/null | wc -l)
echo "[$(date '+%a %d %b %Y %T %Z')] Old backups pruned. Current backup count: $COUNT" >> "$LOG"
