#!/usr/bin/env bash
# Download the four "Who Am I?" celebrity photos from Wikimedia Commons
# and drop them into the running app's static assets folder.
#
# Run on the VM:
#   sudo bash /opt/geoquest/fetch-celebrities.sh
#
# No rebuild / restart is needed — server/index.js serves
# /assets/celebrities/* directly from client/public/assets/celebrities/,
# so a hard-refresh in the browser picks up the new files immediately.
#
# To swap any image for a different one, edit the URLs below.
# Special:FilePath redirects to the current original upload, so you can
# pass any filename from https://commons.wikimedia.org without knowing
# its hash-derived path.

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/geoquest}"
APP_USER="${APP_USER:-geoquest}"
DEST="$INSTALL_DIR/client/public/assets/celebrities"

# Wikimedia Foundation requires a descriptive User-Agent with contact info.
UA="${WIKIMEDIA_UA:-GeoQuestDeploy/1.0 (internal-team-game; contact=admin@local)}"

# Filename on Commons (not the hash path — Special:FilePath resolves it).
# Pick alternatives by replacing the filename with any valid
# "File:<name>" from commons.wikimedia.org.
declare -A SOURCES=(
  [1.jpg]="Albert_Einstein_Head.jpg"
  [2.jpg]="Dwayne_Johnson_2,_2014.jpg"
  [3.jpg]="David_Attenborough_(cropped).jpg"
  [4.jpg]="Beyonce_-_The_Formation_World_Tour,_at_Wembley_Stadium_in_London,_England.jpg"
)

log()  { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$*"; }
fail() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "Must run as root (use sudo)."
id -u "$APP_USER" >/dev/null 2>&1 || fail "User '$APP_USER' not found — run deploy-vm.sh first."
[[ -d "$INSTALL_DIR" ]] || fail "No install at $INSTALL_DIR — run deploy-vm.sh first."

mkdir -p "$DEST"
chown "$APP_USER:$APP_USER" "$DEST"

for DEST_NAME in "${!SOURCES[@]}"; do
  COMMONS_NAME="${SOURCES[$DEST_NAME]}"
  URL="https://commons.wikimedia.org/wiki/Special:FilePath/$COMMONS_NAME"
  OUT="$DEST/$DEST_NAME"

  log "Downloading $DEST_NAME"
  echo "  from Commons: $COMMONS_NAME"

  TMP="$(mktemp --suffix=.jpg)"
  HTTP_CODE="$(curl -sS -L -A "$UA" --max-time 60 -o "$TMP" \
                  -w "%{http_code}" "$URL" || echo "000")"

  if [[ "$HTTP_CODE" != "200" ]]; then
    rm -f "$TMP"
    warn "  HTTP $HTTP_CODE — skipping. Edit SOURCES in this script if the file was renamed."
    continue
  fi

  # Sanity-check size (at least 20 KB; anything smaller is probably an HTML error page)
  SIZE=$(stat -c%s "$TMP")
  if [[ "$SIZE" -lt 20000 ]]; then
    rm -f "$TMP"
    warn "  Response only $SIZE bytes — probably an error page. Skipping."
    continue
  fi

  # Verify it's actually an image (JPEG/PNG magic bytes)
  MIME=$(file -b --mime-type "$TMP" 2>/dev/null || echo unknown)
  if [[ "$MIME" != image/* ]]; then
    rm -f "$TMP"
    warn "  Not an image (mime=$MIME). Skipping."
    continue
  fi

  install -o "$APP_USER" -g "$APP_USER" -m 644 "$TMP" "$OUT"
  rm -f "$TMP"
  ok "  $OUT  ($(numfmt --to=iec "$SIZE"), $MIME)"
done

echo ""
log "Done. Files in $DEST:"
ls -l "$DEST" | grep -vE 'README|^total' || true

echo ""
ok "Hard-refresh your browser (Ctrl+Shift+R) to see the round-3 photos."
echo "   No rebuild or service restart needed — static assets are served live."
