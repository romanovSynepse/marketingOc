# 📊 Дашборд / админка MarketerOC

Живёт на **https://marketer.syneps.ai** (вход по паролю). Состояние деплоя без пароля: `/healthz`.

| Папка | Что внутри |
|---|---|
| `app/` | Сайт (Vite + React), бэкенд (Flask, `backend/`), миграции Postgres (`db_migrations/`). Страница ИИ-команды: `/traffic` (Traffic HQ) |
| `agents/` | ИИ-команда по трафику: Head of Traffic, Scout, Writer, Rewrite Agent, Analyst, Outreach. Подробно в `agents/README.md` |

Запуск локально: `docker compose up -d` из корня репозитория.
Сервер и автодеплой: `deploy/README.md`. Сервер сам подтягивает изменения раз в 5 минут.

Мозг агентов: корневой `CLAUDE.md` + `brain/synoc-marketer-instruction.md` (общие для всех чатов),
плюс файлы `agents/brain/*.md` (голос блога, каналы, красные линии, факты продукта).
