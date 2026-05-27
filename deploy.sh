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

    # Find the directory nginx.conf actually includes (e.g. conf.d or sites-enabled)
    CONF_INC=$(sudo docker exec "$NGINX_CONTAINER" sh -c \
      "grep -h '^[[:space:]]*include' /etc/nginx/nginx.conf 2>/dev/null \
       | grep -v '#' | grep '\*\.conf' | grep -oE '/[^*]+' | head -1 | xargs -r dirname 2>/dev/null") || true

    if [ -z "$CONF_INC" ]; then
      # nginx.conf has no wildcard include — add one for conf.d inside the http block
      echo "  nginx.conf has no conf.d include — injecting one..."
      CONF_INC="/etc/nginx/conf.d"
      sudo docker exec "$NGINX_CONTAINER" sh -c \
        "grep -q 'conf\.d' /etc/nginx/nginx.conf || \
         sed -i 's|http[[:space:]]*{|http {\n    include /etc/nginx/conf.d/*.conf;|' /etc/nginx/nginx.conf"
    fi

    echo "  Using nginx include dir: $CONF_INC"
    sudo docker exec "$NGINX_CONTAINER" mkdir -p "$CONF_INC"
    sudo docker exec "$NGINX_CONTAINER" mkdir -p /var/www/acme-challenge
    sudo docker cp "$NGINX_SRC" "${NGINX_CONTAINER}:${CONF_INC}/api.pokenese.com.conf"
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

# ── SSL certificate acquisition (skipped if cert already exists) ─────────────
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

if ! sudo test -d "$CERT_DIR" 2>/dev/null; then
  if [ -z "$CERTBOT_EMAIL" ]; then
    echo ""
    echo "NOTICE: SSL cert not found. Re-run with --email to enable HTTPS:"
    echo "  ./deploy.sh --email you@example.com"
  else
    echo "==> Obtaining SSL certificate..."

    # Ensure certbot works (yum version has broken urllib3; pip3 version is correct)
    if ! certbot --version &>/dev/null 2>&1; then
      echo "  Repairing certbot..."
      sudo yum remove -y certbot python3-certbot-nginx 2>/dev/null || true
      sudo pip3 install --upgrade certbot certbot-nginx
    fi

    if [ -n "${NGINX_CONTAINER:-}" ]; then
      # Create challenge dir and ensure nginx can read it
      sudo docker exec "$NGINX_CONTAINER" mkdir -p /var/www/acme-challenge
      sudo docker exec "$NGINX_CONTAINER" chmod 755 /var/www/acme-challenge

      # ── Pre-flight: verify nginx can actually serve the challenge path ────────
      echo "  Running pre-flight challenge endpoint test..."
      TEST_TOKEN="preflight-test-$(date +%s)"
      sudo docker exec "$NGINX_CONTAINER" sh -c "printf testok > /var/www/acme-challenge/$TEST_TOKEN && chmod 644 /var/www/acme-challenge/$TEST_TOKEN"
      HTTP_STATUS=$(curl -s -o /tmp/acme-preflight.txt -w "%{http_code}" "http://$DOMAIN/.well-known/acme-challenge/$TEST_TOKEN" 2>/dev/null || echo "000")
      BODY=$(cat /tmp/acme-preflight.txt 2>/dev/null)
      sudo docker exec "$NGINX_CONTAINER" rm -f "/var/www/acme-challenge/$TEST_TOKEN"

      echo "  Pre-flight result: HTTP $HTTP_STATUS  body='$BODY'"

      if [ "$HTTP_STATUS" != "200" ] || [ "$BODY" != "testok" ]; then
        echo ""
        echo "ERROR: Challenge endpoint pre-flight failed (HTTP $HTTP_STATUS, body='$BODY')."
        echo "  Nginx active config for $DOMAIN:"
        sudo docker exec "$NGINX_CONTAINER" cat /etc/nginx/conf.d/api.pokenese.com.conf 2>/dev/null || echo "    (not found)"
        echo "  Nginx error log (last 30 lines):"
        sudo docker exec "$NGINX_CONTAINER" tail -30 /var/log/nginx/error.log 2>/dev/null || echo "    (no log)"
        echo "  Nginx access log (last 10 lines):"
        sudo docker exec "$NGINX_CONTAINER" tail -10 /var/log/nginx/access.log 2>/dev/null || echo "    (no log)"
        echo "  All nginx server blocks (server_name lines):"
        sudo docker exec "$NGINX_CONTAINER" nginx -T 2>/dev/null | grep -E "server_name|listen|deny|auth_basic" | head -40 || true
        exit 1
      fi
      echo "  Pre-flight passed — challenge endpoint is serving correctly."

      # Pass certbot env vars explicitly — docker exec does not inherit host env
      AUTH_HOOK="sudo docker exec -e CERTBOT_TOKEN=\$CERTBOT_TOKEN -e CERTBOT_VALIDATION=\$CERTBOT_VALIDATION $NGINX_CONTAINER sh -c 'printf %s \$CERTBOT_VALIDATION > /var/www/acme-challenge/\$CERTBOT_TOKEN && chmod 644 /var/www/acme-challenge/\$CERTBOT_TOKEN'"
      CLEANUP_HOOK="sudo docker exec -e CERTBOT_TOKEN=\$CERTBOT_TOKEN $NGINX_CONTAINER sh -c 'rm -f /var/www/acme-challenge/\$CERTBOT_TOKEN'"

      sudo certbot certonly \
        --manual \
        --preferred-challenges http \
        --manual-auth-hook   "$AUTH_HOOK" \
        --manual-cleanup-hook "$CLEANUP_HOOK" \
        -d "$DOMAIN" \
        --email "$CERTBOT_EMAIL" \
        --agree-tos \
        --non-interactive \
        -v
    else
      sudo certbot certonly \
        --webroot -w /var/www/acme-challenge \
        -d "$DOMAIN" \
        --email "$CERTBOT_EMAIL" \
        --agree-tos \
        --non-interactive \
        -v
    fi
  fi
fi

# ── Install cert into nginx container (runs on every deploy if cert exists) ───
# Separated from acquisition so a failed docker cp on first run is auto-recovered.
if sudo test -d "$CERT_DIR" 2>/dev/null && [ -n "${NGINX_CONTAINER:-}" ]; then
  # Let's Encrypt live/ files are symlinks — docker cp does not follow them.
  # Resolve to the real archive files before copying.
  FULLCHAIN=$(sudo readlink -f "${CERT_DIR}/fullchain.pem" 2>/dev/null)
  PRIVKEY=$(sudo readlink -f "${CERT_DIR}/privkey.pem" 2>/dev/null)

  if sudo test -f "${FULLCHAIN:-}" && sudo test -f "${PRIVKEY:-}"; then
    echo "==> Installing SSL cert into $NGINX_CONTAINER..."
    sudo docker exec "$NGINX_CONTAINER" mkdir -p /etc/letsencrypt/live/"$DOMAIN"
    sudo docker cp "$FULLCHAIN" "${NGINX_CONTAINER}:/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    sudo docker cp "$PRIVKEY"   "${NGINX_CONTAINER}:/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

    _CONF_INC="${CONF_INC:-/etc/nginx/conf.d}"
    sudo docker cp "$NGINX_SRC" "${NGINX_CONTAINER}:${_CONF_INC}/api.pokenese.com.conf"
    sudo docker exec "$NGINX_CONTAINER" bash -c "
      sed -i 's|listen 80;|listen 443 ssl;|' ${_CONF_INC}/api.pokenese.com.conf
      grep -q 'ssl_certificate ' ${_CONF_INC}/api.pokenese.com.conf || {
        echo 'ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;' >> ${_CONF_INC}/api.pokenese.com.conf
        echo 'ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;'   >> ${_CONF_INC}/api.pokenese.com.conf
      }
    "
    sudo docker exec "$NGINX_CONTAINER" nginx -t
    sudo docker exec "$NGINX_CONTAINER" nginx -s reload
    echo "  SSL enabled inside $NGINX_CONTAINER."
  fi
fi

echo ""
echo "Done. Backend is live at https://$DOMAIN"
