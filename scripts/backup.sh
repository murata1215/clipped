#!/bin/bash
# ============================================================
# Clipped バックアップスクリプト
#
# PostgreSQL ダンプ + 画像ファイルを日次バックアップする。
# 7日以上古いバックアップは自動削除。
#
# 使用方法:
#   手動実行: bash /opt/clipped/scripts/backup.sh
#   cron:     0 3 * * * /opt/clipped/scripts/backup.sh
# ============================================================

set -euo pipefail

# ---- 設定 ----
APP_DIR="/opt/clipped"
BACKUP_ROOT="${APP_DIR}/backups"
PHOTOS_DIR="${APP_DIR}/data/photos"
RETENTION_DAYS=7

# .env.local から DB 接続情報を読み取り
ENV_FILE="${APP_DIR}/.env.local"
DB_NAME=$(grep '^DB_NAME=' "$ENV_FILE" | cut -d'=' -f2)
DB_USER=$(grep '^DB_USER=' "$ENV_FILE" | cut -d'=' -f2)
DB_HOST=$(grep '^DB_HOST=' "$ENV_FILE" | cut -d'=' -f2)
DB_PORT=$(grep '^DB_PORT=' "$ENV_FILE" | cut -d'=' -f2)
DB_PASSWORD=$(grep '^DB_PASSWORD=' "$ENV_FILE" | cut -d'=' -f2-)
export PGPASSWORD="$DB_PASSWORD"

# タイムスタンプ付きディレクトリ
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

echo "[Backup] 開始: ${TIMESTAMP}"

# ---- PostgreSQL ダンプ ----
DB_DUMP="${BACKUP_DIR}/clipped_db.sql.gz"
echo "[Backup] PostgreSQL ダンプ: ${DB_NAME}"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$DB_DUMP"
echo "[Backup]   → $(du -h "$DB_DUMP" | cut -f1)"

# ---- 画像ファイルアーカイブ ----
PHOTOS_ARCHIVE="${BACKUP_DIR}/clipped_photos.tar.gz"
if [ -d "$PHOTOS_DIR" ] && [ "$(ls -A "$PHOTOS_DIR" 2>/dev/null)" ]; then
  echo "[Backup] 画像アーカイブ: ${PHOTOS_DIR}"
  tar -czf "$PHOTOS_ARCHIVE" -C "$APP_DIR" data/photos/
  echo "[Backup]   → $(du -h "$PHOTOS_ARCHIVE" | cut -f1)"
else
  echo "[Backup] 画像なし（スキップ）"
fi

# ---- 古いバックアップの削除 ----
echo "[Backup] ${RETENTION_DAYS}日以上古いバックアップを削除"
find "$BACKUP_ROOT" -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -not -path "$BACKUP_ROOT" -exec rm -rf {} + 2>/dev/null || true

# ---- 完了 ----
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "[Backup] 完了: ${BACKUP_DIR} (${TOTAL_SIZE})"
