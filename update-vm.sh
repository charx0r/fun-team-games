#!/usr/bin/env bash
# Squint Games VM update script.
# Pulls the latest code, rebuilds only what changed, restarts the service.
#
# Usage (as root, on the VM after deploy-vm.sh has already run):
#   sudo ./update-vm.sh
#
# Optional env overrides:
#   BRANCH=some-other-branch     (default: whatever the repo is currently on)
#   INSTALL_DIR=/opt/squint-games    (default)
#   APP_USER=squint-games            (default)
#   SERVICE=squint-games             (default systemd unit)
#   FORCE_REINSTALL=1            (always npm ci even if lockfiles unchanged)

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/squint-games}"
APP_USER="${APP_USER:-squint-games}"
SERVICE="${SERVICE:-squint-games}"
FORCE_REINSTALL="${FORCE_REINSTALL:-0}"

log()  { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$*"; }
fail() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "Must run as root (use sudo)."
[[ -d "$INSTALL_DIR/.git" ]] || fail "No git checkout at $INSTALL_DIR — run deploy-vm.sh first."
id -u "$APP_USER" >/dev/null 2>&1 || fail "User '$APP_USER' not found — run deploy-vm.sh first."

cd "$INSTALL_DIR"
# Ensure the repo's full history is available — deploy-vm.sh originally
# did a shallow clone which caused "Could not access <SHA>" failures on
# subsequent diffs. `git fetch --unshallow` is a no-op if already complete.
sudo -u "$APP_USER" git -C "$INSTALL_DIR" fetch --unshallow 2>/dev/null || true

BRANCH="${BRANCH:-$(sudo -u "$APP_USER" git -C "$INSTALL_DIR" rev-parse --abbrev-ref HEAD)}"

# ---------- Fetch + detect changes ----------
log "Checking for updates on branch '$BRANCH'"
OLD_SHA="$(sudo -u "$APP_USER" git -C "$INSTALL_DIR" rev-parse HEAD)"
sudo -u "$APP_USER" git -C "$INSTALL_DIR" fetch --prune origin "$BRANCH"
NEW_SHA="$(sudo -u "$APP_USER" git -C "$INSTALL_DIR" rev-parse "origin/$BRANCH")"

if [[ "$OLD_SHA" == "$NEW_SHA" ]] && [[ "$FORCE_REINSTALL" != "1" ]]; then
  ok "Already up to date (HEAD=$OLD_SHA). Nothing to do."
  systemctl is-active --quiet "$SERVICE" && ok "$SERVICE is running." || warn "$SERVICE is not running — starting it."
  systemctl start "$SERVICE" || true
  exit 0
fi

echo "  $OLD_SHA → $NEW_SHA"

# Compute the diff BEFORE reset while both SHAs are reachable, and as the
# repo-owning user so object access is unambiguous. Tolerate failure — a
# shallow-clone boundary or a force-push can make OLD_SHA inaccessible,
# which shouldn't halt the update; in that case we conservatively assume
# dependency manifests may have changed and reinstall to be safe.
CHANGED_FILES="$(sudo -u "$APP_USER" git -C "$INSTALL_DIR" diff --name-only "$OLD_SHA" "$NEW_SHA" 2>/dev/null || true)"
if [[ -n "$CHANGED_FILES" ]]; then
  echo "  Changed files:"
  echo "$CHANGED_FILES" | sed 's/^/    /'
else
  warn "Couldn't diff $OLD_SHA..$NEW_SHA (shallow clone or missing object). Forcing full reinstall."
  FORCE_REINSTALL=1
fi

# ---------- Pull ----------
log "Resetting working tree to origin/$BRANCH"
sudo -u "$APP_USER" git -C "$INSTALL_DIR" checkout "$BRANCH"
sudo -u "$APP_USER" git -C "$INSTALL_DIR" reset --hard "origin/$BRANCH"

# ---------- Re-install deps only if manifests changed ----------
server_deps_changed=0
client_deps_changed=0
if echo "$CHANGED_FILES" | grep -qE '^server/(package\.json|package-lock\.json)$'; then
  server_deps_changed=1
fi
if echo "$CHANGED_FILES" | grep -qE '^client/(package\.json|package-lock\.json)$'; then
  client_deps_changed=1
fi

if [[ "$FORCE_REINSTALL" == "1" ]]; then
  server_deps_changed=1
  client_deps_changed=1
fi

if [[ "$server_deps_changed" == "1" ]]; then
  log "Reinstalling server dependencies"
  sudo -u "$APP_USER" bash -c "cd '$INSTALL_DIR' && npm --prefix server ci --omit=dev --silent"
else
  ok "Server deps unchanged — skipping npm ci"
fi

if [[ "$client_deps_changed" == "1" ]]; then
  log "Reinstalling client dependencies"
  sudo -u "$APP_USER" bash -c "cd '$INSTALL_DIR' && npm --prefix client ci --silent"
else
  ok "Client deps unchanged — skipping npm ci"
fi

# ---------- Rebuild client (always; cheap + catches source changes) ----------
log "Rebuilding client"
sudo -u "$APP_USER" bash -c "cd '$INSTALL_DIR' && npm --prefix client run build --silent"

# ---------- Restart service ----------
log "Restarting $SERVICE"
systemctl restart "$SERVICE"
sleep 1

if systemctl is-active --quiet "$SERVICE"; then
  ok "$SERVICE restarted and is active."
else
  journalctl -u "$SERVICE" --no-pager -n 40
  fail "$SERVICE failed to start after update."
fi

# ---------- Summary ----------
echo ""
echo "======================================================================"
ok "Update complete."
echo "  from: $OLD_SHA"
echo "  to:   $NEW_SHA"
echo ""
echo "  Tail logs:   journalctl -u $SERVICE -f"
echo "======================================================================"
