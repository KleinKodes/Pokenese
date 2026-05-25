#!/usr/bin/env bash
# Usage: ./deploy.sh [--email your@email.com]
# Run from the repo root on the EC2 instance.
# Safe to re-run for redeployment — existing processes are not affected.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env.prod"
NGINX_SRC="$BACKEND_DIR/nginx/api.pokenese.com.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/api.pokenese.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/api.pokenese.com"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
DOMAIN="api.pokenese.com"

# ── Parse args ─────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --email) CERTBOT_EMAIL="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# ── Preflight ──────────────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found."
  echo "  cp $BACKEND_DIR/.env.prod.example $ENV_FILE"
  echo "  # then fill in SECRET_KEY, DB_PASSWORD, SEED_SALT"
  exit 1
fi

command -v docker  >/dev/null 2>&1 || { echo "ERROR: docker not found"; exit 1; }
command -v nginx   >/dev/null 2>&1 || { echo "ERROR: nginx not found"; exit 1; }

# ── Pull latest code ───────────────────────────────────────────────────────────
echo "==> Pulling latest code..."
git -C "$REPO_DIR" pull

# ── Install / refresh nginx config ────────────────────────────────────────────
echo "==> Installing nginx config..."
if [ -d /etc/nginx/sites-available ]; then
  # Debian/Ubuntu style
  sudo cp "$NGINX_SRC" "$NGINX_AVAILABLE"
  if [ ! -L "$NGINX_ENABLED" ]; then
    sudo ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  fi
else
  # RHEL/Amazon Linux style — drop directly into conf.d
  sudo cp "$NGINX_SRC" "/etc/nginx/conf.d/api.pokenese.com.conf"
fi
sudo nginx -t

# ── Build and start containers ─────────────────────────────────────────────────
echo "==> Building and starting containers..."
cd "$BACKEND_DIR"
sudo docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up --build -d

# ── Migrations ────────────────────────────────────────────────────────────────
echo "==> Running migrations..."
sudo docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" \
  exec -T backend python scripts/migrate.py

# ── Seed daily challenges (idempotent — skips existing rows) ──────────────────
echo "==> Seeding daily challenges..."
sudo docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" \
  exec -T backend python scripts/seed_daily.py || true

# ── Reload or start nginx ─────────────────────────────────────────────────────
echo "==> Reloading nginx..."
if sudo systemctl is-active --quiet nginx; then
  sudo systemctl reload nginx
else
  sudo systemctl start nginx
fi

# ── SSL (first deploy only) ───────────────────────────────────────────────────
if ! sudo test -d "/etc/letsencrypt/live/$DOMAIN" 2>/dev/null; then
  if [ -z "$CERTBOT_EMAIL" ]; then
    echo ""
    echo "NOTICE: SSL cert not found. To enable HTTPS run:"
    echo "  sudo certbot --nginx -d $DOMAIN --email you@example.com --agree-tos --non-interactive"
    echo "Or re-run this script with: ./deploy.sh --email you@example.com"
  else
    echo "==> Obtaining SSL certificate..."
    sudo certbot --nginx -d "$DOMAIN" \
      --email "$CERTBOT_EMAIL" \
      --agree-tos \
      --non-interactive
    sudo systemctl reload nginx
  fi
fi

echo ""
echo "Done. Backend is live at https://$DOMAIN"
