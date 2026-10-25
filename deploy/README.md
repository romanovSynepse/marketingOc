# Деплой marketer.syneps.ai

Маркетинговая админка (Traffic HQ + ИИ-команда по трафику) на отдельном сервере, чтобы не трогать прод Syneps.

## 1. Сервер
Hetzner Console → Add Server: Ubuntu 24.04, тип CX22, свой SSH-ключ. Запомнить IP.

## 2. DNS
Spaceship → syneps.ai → DNS → A-запись: host `marketer`, value = IP сервера, TTL 5 min.

## 3. Установка (от root на сервере)
```bash
git clone https://github.com/romanovSynepse/marketingOc.git /opt/marketingoc
cd /opt/marketingoc && git checkout claude/eager-cannon-j3xvlm
bash deploy/setup-server.sh marketer.syneps.ai nick
```
Скрипт ставит Docker и файрвол (22/80/443), спрашивает пароль для входа (его вводит Ник),
поднимает Postgres, бэкенд, фронт и Caddy с автоматическим HTTPS и basic auth.
Наружу открыт только Caddy.

## 4. Ключи агентов
`/opt/marketingoc/traffic-team/.env` (шаблон `.env.example`): `ANTHROPIC_API_KEY`, `THREADS_ACCOUNTS`,
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Автопилот агентов:
```bash
docker compose -f docker-compose.yml -f deploy/docker-compose.prod.yml --env-file deploy/.env --profile autopilot up -d --build
```

## 5. Данные Instagram (разово)
```bash
docker compose -f docker-compose.yml -f deploy/docker-compose.prod.yml --env-file deploy/.env \
  --profile autopilot run --rm traffic-team python -m synteam import-metricool data/metricool_instagram_nickromanov.json
```

## 6. Автодеплой (по желанию)
GitHub → Settings → Secrets → Actions: `DEPLOY_HOST` (IP), `DEPLOY_SSH_KEY` (приватный ключ, чей .pub
лежит в `/root/.ssh/authorized_keys`). После мержа в `main` каждый пуш обновляет сервер
(`.github/workflows/deploy.yml`). Если репозиторий станет приватным, серверу нужен deploy key для `git pull`.

## Проверка
https://marketer.syneps.ai/traffic → логин `nick` + пароль.
