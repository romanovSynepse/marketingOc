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
MIGRATIONS=dashboard/app/db_migrations
AGENTS_ENV=dashboard/agents/.env

log() { echo "[$(date '+%F %T')] $*"; }

# Ветка, за которой следит сервер. Переопределяется строкой DEPLOY_BRANCH=... в deploy/.env
target_branch() {
  local b
  b=$(grep -E '^DEPLOY_BRANCH=' deploy/.env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"'"'"' ')
  echo "${b:-main}"
}

# Ключи агентов раньше лежали в traffic-team/.env (не в git): переносим на новое место один раз
move_legacy_env() {
  if [ -f traffic-team/.env ] && [ ! -f "$AGENTS_ENV" ]; then
    mv traffic-team/.env "$AGENTS_ENV"
    log "moved traffic-team/.env -> $AGENTS_ENV"
  fi
  [ -d traffic-team ] && find traffic-team -depth -type d -empty -delete 2>/dev/null || true
}

# Автопилот агентов включается сам, как только в dashboard/agents/.env появился ключ Anthropic
autopilot_enabled() {
  [ -f "$AGENTS_ENV" ] && grep -Eq '^ANTHROPIC_API_KEY=.+' "$AGENTS_ENV"
}

# Начальные миграции (V0001–V0003) Postgres применяет сам при первом старте.
# Начиная с V0004 они идемпотентные, поэтому прогоняем их на каждом деплое.
migrate() {
  local f version out
  for f in "$MIGRATIONS"/V*.sql; do
    version=$(basename "$f" | sed -E 's/^V0*([0-9]+)__.*/\1/')
    [ "$version" -ge 4 ] || continue
    # при ошибке деплой останавливается и не пишет новый хэш: /healthz покажет старый коммит
    if ! out=$("${COMPOSE[@]}" exec -T postgres psql -q -v ON_ERROR_STOP=1 -U postgres -d marketingoc < "$f" 2>&1); then
      log "migration $(basename "$f") FAILED: $(grep -v NOTICE <<<"$out")"
      return 1
    fi
    log "migration $(basename "$f") ok"
  done
}

deploy() {
  local restart_caddy="$1"
  local autopilot=no
  move_legacy_env
  if autopilot_enabled; then COMPOSE+=(--profile autopilot); autopilot=yes; fi
  log "docker compose up -d --build (autopilot: $autopilot)"
  "${COMPOSE[@]}" up -d --build --remove-orphans
  migrate
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
    # Переход на целевую ветку (по умолчанию main), но только когда она уже содержит всё,
    # что сейчас задеплоено: так сервер не откатится, пока PR не принят.
    current=$(git rev-parse --abbrev-ref HEAD)
    target=$(target_branch)
    if [ "$current" != "$target" ] && git rev-parse -q --verify "origin/$target" >/dev/null \
        && git merge-base --is-ancestor HEAD "origin/$target"; then
      old_rev=$(git rev-parse HEAD)
      git checkout --quiet -B "$target" --track "origin/$target"
      log "switch branch $current -> $target (${old_rev:0:7} -> $(git rev-parse --short HEAD))"
      caddy=no
      if git diff --name-only "$old_rev" HEAD | grep -qx 'deploy/Caddyfile'; then caddy=yes; fi
      exec 9>&-
      exec bash "$SELF" _deploy "$caddy"
    fi
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
