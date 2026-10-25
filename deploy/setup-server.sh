#!/usr/bin/env bash
# Один раз на чистом сервере Hetzner (Ubuntu 24.04), от root:
#   curl -fsSL https://raw.githubusercontent.com/romanovSynepse/marketingOc/main/deploy/setup-server.sh | bash -s -- marketer.syneps.ai nick
set -euo pipefail
DOMAIN="${1:?домен, например marketer.syneps.ai}"
AUTH_USER="${2:-nick}"
REPO="https://github.com/romanovSynepse/marketingOc.git"
DIR=/opt/marketingoc

command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh
apt-get install -y ufw git >/dev/null
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

[ -d "$DIR/.git" ] || git clone "$REPO" "$DIR"
cd "$DIR"

if [ ! -f deploy/.env ]; then
  read -rsp "Пароль для входа на $DOMAIN: " PASS </dev/tty; echo
  HASH=$(docker run --rm caddy:2.8-alpine caddy hash-password --plaintext "$PASS")
  printf 'DOMAIN=%s\nAUTH_USER=%s\nAUTH_HASH=%s\n' "$DOMAIN" "$AUTH_USER" "${HASH//\$/\$\$}" > deploy/.env
  chmod 600 deploy/.env
fi
[ -f traffic-team/.env ] || cp traffic-team/.env.example traffic-team/.env

docker compose -f docker-compose.yml -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
echo "Готово: https://$DOMAIN (логин $AUTH_USER). Ключи агентов: $DIR/traffic-team/.env"
