#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE="https://github.com/UB-PARASITE/TalesrunnerRPG_Dialog.git"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

command -v git >/dev/null || { echo "Install Git first: https://git-scm.com/" >&2; exit 1; }
git clone "$REMOTE" "$TMP_DIR/repo"
cp -a "$SCRIPT_DIR/." "$TMP_DIR/repo/"
git -C "$TMP_DIR/repo" add -A
if [[ -n "$(git -C "$TMP_DIR/repo" status --porcelain)" ]]; then
  git -C "$TMP_DIR/repo" commit -m "Publish Dialog research explorer and datasets"
else
  echo "No file changes to publish."
fi
git -C "$TMP_DIR/repo" push origin main

echo "Published: https://github.com/UB-PARASITE/TalesrunnerRPG_Dialog"
echo "Pages: https://ub-parasite.github.io/TalesrunnerRPG_Dialog/"
echo "If Pages is not enabled, set Settings > Pages > Source > GitHub Actions."
