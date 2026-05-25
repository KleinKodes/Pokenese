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

# ── Configure nginx ────────────────────────────────────────────────────────────
echo "==> Configuring nginx..."
if sudo systemctl is-active --quiet nginx; then
  # nginx is running as a host service — just reload
  sudo systemctl reload nginx

elif sudo ss -tlnp | grep ':80 ' | grep -q 'docker-proxy'; then
  # Port 80 is owned by a Docker container (the co-hosted app).
  # Find the container running nginx and inject our server block into it.
  echo "  Port 80 is owned by a Docker container — finding nginx container..."
  NGINX_CONTAINER=""
  for name in $(sudo docker ps --format '{{.Names}}'); do
    if sudo docker exec "$name" which nginx >/dev/null 2>&1; then
      NGINX_CONTAINER="$name"
      break
    fi
  done

  if [ -n "$NGINX_CONTAINER" ]; then
    echo "  Injecting config into container: $NGINX_CONTAINER"
    # Ensure acme-challenge webroot exists inside the container
    sudo docker exec "$NGINX_CONTAINER" mkdir -p /var/www/acme-challenge
    sudo docker exec "$NGINX_CONTAINER" mkdir -p /etc/nginx/conf.d
    sudo docker cp "$NGINX_SRC" "${NGINX_CONTAINER}:/etc/nginx/conf.d/api.pokenese.com.conf"
    sudo docker exec "$NGINX_CONTAINER" nginx -t
    sudo docker exec "$NGINX_CONTAINER" nginx -s reload
    echo "  nginx reloaded inside $NGINX_CONTAINER."
  else
    echo "WARNING: Could not find a running nginx container."
    echo "  The API is accessible at http://$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo HOST):8001"
    echo "  Proxy api.pokenese.com → 127.0.0.1:8001 manually to enable the domain."
  fi

else
  # Nothing on port 80 — start our own nginx
  if sudo systemctl start nginx; then
    echo "  nginx started."
  else
    echo "ERROR: nginx failed to start. Details:"
    sudo journalctl -xeu nginx.service --no-pager | tail -30
    exit 1
  fi
fi

# ── SSL (first deploy only) ───────────────────────────────────────────────────
if ! sudo test -d "/etc/letsencrypt/live/$DOMAIN" 2>/dev/null; then
  if [ -z "$CERTBOT_EMAIL" ]; then
    echo ""
    echo "NOTICE: SSL cert not found. Re-run with --email to enable HTTPS:"
    echo "  ./deploy.sh --email you@example.com"
  else
    echo "==> Obtaining SSL certificate (webroot mode)..."

    # Ensure certbot works (yum version has broken urllib3; pip3 version is correct)
    if ! certbot --version &>/dev/null 2>&1; then
      echo "  Repairing certbot..."
      sudo yum remove -y certbot python3-certbot-nginx 2>/dev/null || true
      sudo pip3 install --upgrade certbot certbot-nginx
    fi

    # Webroot mode: challenge files written to host, served by nginx container
    WEBROOT=/tmp/acme-challenge
    sudo mkdir -p "$WEBROOT"
    # Bind-mount the webroot into the nginx container so it can serve challenges
    # (containers don't support live mounts, so we symlink via docker cp)
    sudo certbot certonly \
      --webroot -w "$WEBROOT" \
      -d "$DOMAIN" \
      --email "$CERTBOT_EMAIL" \
      --agree-tos \
      --non-interactive \
      --http-01-port 80 \
      --preferred-challenges http

    # Copy obtained certs into the nginx container
    CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
    if [ -n "${NGINX_CONTAINER:-}" ] && sudo test -d "$CERT_DIR"; then
      echo "  Copying certs into $NGINX_CONTAINER..."
      sudo docker exec "$NGINX_CONTAINER" mkdir -p /etc/letsencrypt/live/"$DOMAIN"
      sudo docker cp "${CERT_DIR}/fullchain.pem" "${NGINX_CONTAINER}:/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
      sudo docker cp "${CERT_DIR}/privkey.pem"   "${NGINX_CONTAINER}:/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

      # Upgrade nginx config to SSL
      sudo docker cp "$NGINX_SRC" "${NGINX_CONTAINER}:/etc/nginx/conf.d/api.pokenese.com.conf"
      sudo docker exec "$NGINX_CONTAINER" bash -c "
        sed -i 's|listen 80;|listen 443 ssl;|' /etc/nginx/conf.d/api.pokenese.com.conf
        echo 'ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;'  >> /etc/nginx/conf.d/api.pokenese.com.conf
        echo 'ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;'   >> /etc/nginx/conf.d/api.pokenese.com.conf
      " 2>/dev/null || true
      sudo docker exec "$NGINX_CONTAINER" nginx -s reload
      echo "  SSL enabled inside $NGINX_CONTAINER."
    fi
  fi
fi

echo ""
echo "Done. Backend is live at https://$DOMAIN"
