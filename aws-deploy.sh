#!/usr/bin/env bash
# Deploy or redeploy the Pokenese backend to EC2 from your local machine.
#
# Usage:
#   ./aws-deploy.sh                          # uses saved config in .deploy-config
#   ./aws-deploy.sh --instance-id i-xxx      # override instance
#   ./aws-deploy.sh --email you@example.com  # also run certbot for SSL
#
# Options:
#   --instance-id   EC2 instance ID          (or POKENESE_INSTANCE_ID env var)
#   --key           Path to SSH .pem key     (auto-detected from instance key pair if omitted)
#   --user          SSH user                 (default: ec2-user)
#   --region        AWS region               (default: AWS_DEFAULT_REGION or us-east-1)
#   --email         Email for Let's Encrypt  (first deploy only)
#   --save          Save --instance-id / --key / --user / --region to .deploy-config
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.deploy-config"
REPO_NAME="Pokenese"
REPO_URL="https://github.com/KleinKodes/Pokenese.git"
REMOTE_HOME="/home"

# ── Load saved config ──────────────────────────────────────────────────────────
if [ -f "$CONFIG_FILE" ]; then
  # shellcheck source=/dev/null
  source "$CONFIG_FILE"
fi

# Defaults (may be overridden by config or args below)
INSTANCE_ID="${POKENESE_INSTANCE_ID:-}"
SSH_KEY="${POKENESE_SSH_KEY:-}"
SSH_USER="${POKENESE_SSH_USER:-ec2-user}"
AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
CERTBOT_EMAIL=""
SAVE_CONFIG=false

# ── Parse args ─────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --instance-id) INSTANCE_ID="$2";  shift 2 ;;
    --key)         SSH_KEY="$2";      shift 2 ;;
    --user)        SSH_USER="$2";     shift 2 ;;
    --region)      AWS_REGION="$2";   shift 2 ;;
    --email)       CERTBOT_EMAIL="$2"; shift 2 ;;
    --save)        SAVE_CONFIG=true;  shift ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# ── Preflight ──────────────────────────────────────────────────────────────────
command -v aws >/dev/null 2>&1 || { echo "ERROR: aws CLI not found"; exit 1; }
command -v ssh >/dev/null 2>&1 || { echo "ERROR: ssh not found"; exit 1; }

if [ -z "$INSTANCE_ID" ]; then
  echo "ERROR: --instance-id is required (or set POKENESE_INSTANCE_ID, or use --save after first run)"
  exit 1
fi

# ── Resolve public IP ──────────────────────────────────────────────────────────
echo "==> Resolving instance $INSTANCE_ID..."
INSTANCE_INFO=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'Reservations[0].Instances[0].{IP:PublicIpAddress,Key:KeyName,State:State.Name}' \
  --output json)

INSTANCE_STATE=$(echo "$INSTANCE_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['State'])")
if [ "$INSTANCE_STATE" != "running" ]; then
  echo "ERROR: Instance is in state '$INSTANCE_STATE', expected 'running'"
  exit 1
fi

PUBLIC_IP=$(echo "$INSTANCE_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['IP'])")
KEY_PAIR_NAME=$(echo "$INSTANCE_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['Key'])")
echo "    IP: $PUBLIC_IP   Key pair: $KEY_PAIR_NAME"

# ── Resolve SSH key path ───────────────────────────────────────────────────────
if [ -z "$SSH_KEY" ]; then
  for candidate in \
    "$HOME/.ssh/${KEY_PAIR_NAME}.pem" \
    "$HOME/.ssh/${KEY_PAIR_NAME}" \
    "$HOME/.ssh/id_rsa" \
    "$HOME/.ssh/id_ed25519"; do
    if [ -f "$candidate" ]; then
      SSH_KEY="$candidate"
      echo "    Key: $SSH_KEY (auto-detected)"
      break
    fi
  done
fi

if [ -z "$SSH_KEY" ] || [ ! -f "$SSH_KEY" ]; then
  echo "ERROR: SSH key not found. Pass --key /path/to/key.pem"
  exit 1
fi

# ── Save config for future runs ────────────────────────────────────────────────
if $SAVE_CONFIG; then
  cat > "$CONFIG_FILE" <<EOF
POKENESE_INSTANCE_ID="$INSTANCE_ID"
POKENESE_SSH_KEY="$SSH_KEY"
POKENESE_SSH_USER="$SSH_USER"
AWS_DEFAULT_REGION="$AWS_REGION"
EOF
  echo "==> Saved config to $CONFIG_FILE"
fi

SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
REMOTE="${SSH_USER}@${PUBLIC_IP}"
REMOTE_REPO_DIR="$REMOTE_HOME/$SSH_USER/$REPO_NAME"

# ── Sync .env.prod if it exists locally ───────────────────────────────────────
LOCAL_ENV="$SCRIPT_DIR/backend/.env.prod"
if [ -f "$LOCAL_ENV" ]; then
  echo "==> Uploading .env.prod..."
  # Ensure target dir exists first
  ssh $SSH_OPTS "$REMOTE" "mkdir -p $REMOTE_REPO_DIR/backend"
  scp $SSH_OPTS "$LOCAL_ENV" "${REMOTE}:${REMOTE_REPO_DIR}/backend/.env.prod"
fi

# ── Bootstrap: install deps if needed, clone or pull ─────────────────────────
echo "==> Bootstrapping remote..."
ssh $SSH_OPTS "$REMOTE" bash <<BOOTSTRAP
set -euo pipefail

# Docker
if ! command -v docker &>/dev/null; then
  echo "  Installing Docker..."
  sudo yum update -y -q
  sudo yum install -y docker git
  sudo systemctl enable --now docker
  sudo usermod -aG docker \$USER
fi

# Docker Compose plugin
if ! docker compose version &>/dev/null 2>&1; then
  echo "  Installing Docker Compose plugin..."
  DOCKER_CONFIG=\${DOCKER_CONFIG:-\$HOME/.docker}
  mkdir -p \$DOCKER_CONFIG/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" \
    -o "\$DOCKER_CONFIG/cli-plugins/docker-compose"
  chmod +x "\$DOCKER_CONFIG/cli-plugins/docker-compose"
fi

# nginx + certbot
if ! command -v nginx &>/dev/null; then
  echo "  Installing nginx and certbot..."
  sudo yum install -y nginx python3-certbot-nginx
  sudo systemctl enable --now nginx
fi

# Repo
if [ ! -d "$REMOTE_REPO_DIR/.git" ]; then
  echo "  Cloning repo..."
  mkdir -p "$REMOTE_HOME/$SSH_USER"
  git clone $REPO_URL "$REMOTE_REPO_DIR"
else
  echo "  Pulling latest..."
  git -C "$REMOTE_REPO_DIR" pull
fi
BOOTSTRAP

# ── Run deploy.sh on remote ────────────────────────────────────────────────────
echo "==> Running deploy.sh on remote..."
DEPLOY_ARGS=""
[ -n "$CERTBOT_EMAIL" ] && DEPLOY_ARGS="--email $CERTBOT_EMAIL"

ssh $SSH_OPTS "$REMOTE" "bash $REMOTE_REPO_DIR/deploy.sh $DEPLOY_ARGS"

echo ""
echo "Done. API is live at http://$PUBLIC_IP (or https://api.pokenese.com once DNS + SSL are set)"
