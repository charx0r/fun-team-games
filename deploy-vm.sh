#!/usr/bin/env bash
# Squint Games VM deploy script.
#
# Usage (as root, on a fresh Ubuntu/Debian VM):
#   curl -fsSL <raw-url>/deploy-vm.sh -o deploy-vm.sh
#   chmod +x deploy-vm.sh
#   sudo ./deploy-vm.sh
#
# Optional env overrides:
#   REPO_URL=https://github.com/charx0r/fun-team-games.git  (default)
#   BRANCH=claude/squint-games-multiplayer-game-xJO5g           (default)
#   INSTALL_DIR=/opt/squint-games                               (default)
#   APP_USER=squint-games                                       (default)
#   APP_PORT=3000                                           (default)
#   DOMAIN=squint-games.example.com                             (enables HTTPS via Caddy)
#   EMAIL=you@example.com                                   (for Let's Encrypt, recommended)
#
# Idempotent: safe to re-run. Subsequent runs will git pull, rebuild, and restart.

set -euo pipefail

# ---------- Config ----------
REPO_URL="${REPO_URL:-https://github.com/charx0r/fun-team-games.git}"
BRANCH="${BRANCH:-claude/squint-games-multiplayer-game-xJO5g}"
INSTALL_DIR="${INSTALL_DIR:-/opt/squint-games}"
APP_USER="${APP_USER:-squint-games}"
APP_PORT="${APP_PORT:-3000}"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

# ---------- Helpers ----------
log()   { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
warn()  { printf "\033[1;33m! %s\033[0m\n" "$*"; }
fail()  { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }
need()  { command -v "$1" >/dev/null 2>&1; }

[[ $EUID -eq 0 ]] || fail "Must run as root (use sudo)."
[[ -f /etc/debian_version ]] || fail "This script targets Debian/Ubuntu. Adapt for other distros."

# ---------- System packages ----------
log "Installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -qq
apt-get install -y -qq curl ca-certificates gnupg git ufw >/dev/null

# ---------- Node.js 20 ----------
if ! need node || [[ "$(node -v 2>/dev/null | cut -c2-3)" -lt 20 ]]; then
  log "Installing Node.js 20 from NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
else
  log "Node.js already present: $(node -v)"
fi

# ---------- App user ----------
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  log "Creating system user '$APP_USER'"
  useradd --system --create-home --home-dir "/home/$APP_USER" --shell /usr/sbin/nologin "$APP_USER"
else
  log "User '$APP_USER' already exists"
fi

# ---------- Clone / pull repo ----------
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
  log "Cloning $REPO_URL → $INSTALL_DIR"
  mkdir -p "$INSTALL_DIR"
  chown "$APP_USER:$APP_USER" "$INSTALL_DIR"
  sudo -u "$APP_USER" git clone --branch "$BRANCH" --depth 50 "$REPO_URL" "$INSTALL_DIR"
else
  log "Updating repo in $INSTALL_DIR"
  sudo -u "$APP_USER" git -C "$INSTALL_DIR" fetch --prune origin
  sudo -u "$APP_USER" git -C "$INSTALL_DIR" checkout "$BRANCH"
  sudo -u "$APP_USER" git -C "$INSTALL_DIR" reset --hard "origin/$BRANCH"
fi

# ---------- Install deps + build client ----------
log "Installing dependencies (server + client)"
sudo -u "$APP_USER" bash -c "cd '$INSTALL_DIR' && npm --prefix server ci --omit=dev --silent"
sudo -u "$APP_USER" bash -c "cd '$INSTALL_DIR' && npm --prefix client ci --silent"

log "Building client"
sudo -u "$APP_USER" bash -c "cd '$INSTALL_DIR' && npm --prefix client run build --silent"

# ---------- systemd unit ----------
log "Writing systemd unit /etc/systemd/system/squint-games.service"
cat > /etc/systemd/system/squint-games.service <<UNIT
[Unit]
Description=Squint Games game server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$INSTALL_DIR/server
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=3
# Hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable squint-games.service >/dev/null
systemctl restart squint-games.service
sleep 1

if ! systemctl is-active --quiet squint-games.service; then
  journalctl -u squint-games.service --no-pager -n 40
  fail "squint-games.service failed to start"
fi
log "squint-games.service is active"

# ---------- Firewall ----------
if ufw status | grep -q "Status: active"; then
  log "ufw is active — adding allow rules"
else
  log "Enabling ufw with sane defaults (OpenSSH + HTTP/HTTPS)"
  ufw --force default deny incoming >/dev/null
  ufw --force default allow outgoing >/dev/null
  ufw allow OpenSSH >/dev/null
fi
ufw allow 80/tcp  >/dev/null || true
ufw allow 443/tcp >/dev/null || true
if [[ -z "$DOMAIN" ]]; then
  # Also expose the raw port so people can hit http://IP:3000
  ufw allow "${APP_PORT}/tcp" >/dev/null || true
fi
ufw --force enable >/dev/null

# ---------- Reverse proxy / HTTPS (optional Caddy) ----------
if [[ -n "$DOMAIN" ]]; then
  log "Configuring Caddy reverse proxy for $DOMAIN (auto-HTTPS via Let's Encrypt)"

  if ! need caddy; then
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https >/dev/null
    curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
      | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
      > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -y -qq
    apt-get install -y -qq caddy >/dev/null
  fi

  cat > /etc/caddy/Caddyfile <<CADDY
{
$( [[ -n "$EMAIL" ]] && echo "  email $EMAIL" )
}

$DOMAIN {
  reverse_proxy localhost:$APP_PORT
  encode zstd gzip
}
CADDY

  systemctl enable caddy >/dev/null
  systemctl restart caddy
  log "Caddy running. Point $DOMAIN's A record at this VM's public IP."
fi

# ---------- Done ----------
PUBLIC_IP="$(curl -fsS ifconfig.me || echo '<your-vm-ip>')"
echo ""
echo "======================================================================"
echo "  Squint Games is running."
echo ""
if [[ -n "$DOMAIN" ]]; then
  echo "  → https://$DOMAIN"
  echo "    (DNS must point to this VM; cert will provision automatically)"
else
  echo "  → http://$PUBLIC_IP:$APP_PORT"
fi
echo ""
echo "  Manage:"
echo "    systemctl status  squint-games"
echo "    systemctl restart squint-games"
echo "    journalctl -u squint-games -f"
echo ""
echo "  To update to the latest code later, just re-run this script."
echo "======================================================================"
