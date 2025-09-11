#!/usr/bin/env bash
set -euo pipefail

# CONFIG
RUN_DRY=1                 # dry-run support
# REMOTE="mydocker"         # SSH alias (or user@host)
# REMOTE_DIR="/srv/myapp"   # target path on the Linux host
EXCLUDES_FILE=".rsyncignore"

# ensure we run from repo root even if called from VS Code
cd "$(dirname "$0")/.."

# -z compress, -a archive, -v verbose, --delete keep remote in sync
# --mkpath creates the target dir if rsync is new enough; if not, pre-create it once.
RSYNC_FLAGS=(-avz --delete --human-readable)
[[ -f "$EXCLUDES_FILE" ]] && RSYNC_FLAGS+=(--exclude-from="$EXCLUDES_FILE")

# dry-run support: RUN_DRY=1 ./scripts/rsync.sh
if [[ "${RUN_DRY:-0}" = "1" ]]; then
  RSYNC_FLAGS+=(--dry-run)
  echo "Doing a dry run..."
fi

# Trailing slashes matter: './' -> copy contents of current dir
rsync "${RSYNC_FLAGS[@]}" ./  "${REMOTE}:${REMOTE_DIR}/"

echo "Done. Synced to ${REMOTE}:${REMOTE_DIR}"
