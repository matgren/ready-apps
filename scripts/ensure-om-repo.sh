#!/usr/bin/env bash
# Ensures OM_REPO is set and points to a valid Open Mercato checkout.
#
# Resolution order:
#   1. $OM_REPO already set → validate & fetch
#   2. .cache/open-mercato/ exists → fetch & export
#   3. Nothing → shallow clone to .cache/open-mercato/ & export
#
# Usage:
#   source scripts/ensure-om-repo.sh
#   # Now $OM_REPO is set and up to date

set -euo pipefail

CACHE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.cache/open-mercato"
REPO_URL="https://github.com/open-mercato/open-mercato.git"

if [ -n "${OM_REPO:-}" ] && [ -d "$OM_REPO/.git" ]; then
  echo "[ensure-om-repo] Using \$OM_REPO=$OM_REPO"
  git -C "$OM_REPO" fetch --quiet 2>/dev/null || true
elif [ -d "$CACHE_DIR/.git" ]; then
  echo "[ensure-om-repo] Using cached repo at $CACHE_DIR"
  git -C "$CACHE_DIR" fetch --quiet 2>/dev/null || true
  export OM_REPO="$CACHE_DIR"
else
  echo "[ensure-om-repo] Cloning OM repo to $CACHE_DIR (first run)..."
  git clone --depth 1 "$REPO_URL" "$CACHE_DIR"
  export OM_REPO="$CACHE_DIR"
fi

echo "[ensure-om-repo] OM_REPO=$OM_REPO"
