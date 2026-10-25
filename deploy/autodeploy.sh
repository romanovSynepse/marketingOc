#!/usr/bin/env bash
# Автодеплой без SSH-ключей и секретов GitHub: сервер сам раз в 5 минут проверяет ветку.
#   bash deploy/autodeploy.sh install   # поставить cron и сразу задеплоить текущее состояние
#   bash deploy/autodeploy.sh           # одна проверка (её и вызывает cron)
#   bash deploy/autodeploy.sh force     # пересобрать без проверки
# Лог: /var/log/autodeploy.log. Повторный запуск безопасен.
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

DIR=/opt/marketingoc
LOG=/var/log/autodeploy.log
LOCK=/var/lock/marketingoc-autodeploy.lock
SELF="$DIR/deploy/autodeploy.sh"
CRON_LINE="*/5 * * * * bash $SELF >> $LOG 2>&1"
COMPOSE=(docker compose -f docker-compose.yml -f deploy/docker-compose.prod.yml --env-file deploy/.env)

log() { echo "[$(date '+%F %T')] $*"; }

deploy() {
  local restart_caddy="$1"
  log "docker compose up -d --build"
  "${COMPOSE[@]}" up -d --build --remove-orphans
  if [ "$restart_caddy" = yes ]; then
    # Caddyfile смонтирован файлом: после git pull у него новый inode, нужен рестарт, а не reload
    log "restart caddy"
    "${COMPOSE[@]}" restart caddy
  fi
  docker image prune -f >/dev/null
  mkdir -p deploy/state
  git rev-parse HEAD > deploy/state/commit
  log "deploy done at $(git rev-parse --short HEAD)"
}

install_cron() {
  local current
  current=$(crontab -l 2>/dev/null || true)
  if grep -Fq "$SELF" <<<"$current"; then
    log "cron already installed"
  else
    printf '%s\n%s\n' "$current" "$CRON_LINE" | sed '/^$/d' | crontab -
    log "cron installed: $CRON_LINE"
  fi
  touch "$LOG"
}

cd "$DIR"
exec 9>"$LOCK"
if ! flock -n 9; then
  log "another deploy is running, skip"
  exit 0
fi

case "${1:-run}" in
  install)
    install_cron
    deploy yes
    ;;
  force)
    deploy yes
    ;;
  run)
    git fetch --quiet origin
    local_rev=$(git rev-parse HEAD)
    remote_rev=$(git rev-parse '@{u}')
    if [ "$local_rev" = "$remote_rev" ]; then
      exit 0
    fi
    log "update ${local_rev:0:7} -> ${remote_rev:0:7}"
    changed=$(git diff --name-only "$local_rev" "$remote_rev")
    git pull --ff-only --quiet
    caddy=no
    if grep -qx 'deploy/Caddyfile' <<<"$changed"; then caddy=yes; fi
    # деплоим логикой из только что подтянутой версии скрипта (lock переоткроется в новом процессе)
    exec 9>&-
    exec bash "$SELF" _deploy "$caddy"
    ;;
  _deploy)
    deploy "${2:-no}"
    ;;
  *)
    echo "usage: $0 [install|run|force]" >&2
    exit 1
    ;;
esac
