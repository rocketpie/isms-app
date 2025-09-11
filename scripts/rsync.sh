#!/usr/bin/env bash
set -euo pipefail

# ---- Config (override via env) ----

: "${RUN_DRY:=0}"                       # dry-run support
: "${SYNC_SRC:=docker/}"                # sync this source folder
: "${REMOTE:?REMOTE not set}"           # SSH alias (or user@host)
: "${REMOTE_DIR:?REMOTE_DIR not set}"   # target path on the remote host
EXCLUDES_FILE=".rsyncignore"

# -z compress, -a archive, -v verbose, --delete keep remote in sync
# --mkpath creates the target dir if rsync is new enough; if not, pre-create it once.
RSYNC_FLAGS=(-az --delete --human-readable --itemize-changes)
[[ -f "$EXCLUDES_FILE" ]] && RSYNC_FLAGS+=(--exclude-from="$EXCLUDES_FILE")

# dry-run support: RUN_DRY=1 ./scripts/rsync.sh
if [[ "${RUN_DRY:-0}" = "1" ]]; then
  RSYNC_FLAGS+=(--dry-run)
  echo "Doing a dry run..."
fi

# Trailing slashes matter: './' -> copy contents of current dir
rsync "${RSYNC_FLAGS[@]}" "$SYNC_SRC" "${REMOTE}:${REMOTE_DIR}/"

echo "Done. Synced to ${REMOTE}:${REMOTE_DIR}"
