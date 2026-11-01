# ⚙️ Инфраструктура конвейера SynOC

Сбор данных (HikerAPI / ScrapeCreators / Apify), Supabase + повторные замеры, транскрипция, эмбеддинги.
Основа: инструкция, раздел 22; `docs/SynOC_Reels_Pipeline_DevDoc.pdf` (дорожная карта, недели 2–3).

## Статус

| Часть | Файл | Статус |
|---|---|---|
| База: accounts / reels / snapshots / scripts + формулы отбора | `supabase/001_schema.sql` | ✅ готова, проверена на тестовых данных |
| Сборщик HikerAPI → Supabase | `collector/synoc_collect.py` | ✅ готов; поля HikerAPI сверить при первом запуске |
| Расписание: замер каждые 3 часа | `.github/workflows/synoc-collect.yml` | ✅ ждёт ключей (без них пропускается) |
| Транскрипция (ElevenLabs Scribe / Deepgram) → `scripts` | — | следующий этап |
| Эмбеддинги, проверка рерайта | — | неделя 4 |

## Как это работает

```
список аккаунтов ниши ──► каждые 3 ч: HikerAPI ──► snapshots (просмотры, лайки, комменты, пересылки)
                                                        │
                    вью reel_scores: норма автора, ×нормы, просмотры/подписчики,
                    ER, скорость (6/24/72 ч, сейчас), флаг накрутки
                                                        │
                    вью outliers: > 3× нормы, без закрепов и накрутки ──► разбор и рерайт
```

Норма автора = медиана последних 30 роликов, без закрепов и без роликов моложе 48 часов.
Накрутка = просмотры выше нормы, а ER ниже трети обычного ER автора (ориентир, уточним на данных).

## Запуск: 5 шагов для Ника

1. **Supabase.** supabase.com → New project (регион — Frankfurt) → открой SQL Editor →
   вставь целиком `infra/supabase/001_schema.sql` → Run. Пришли скриншот результата.
2. **HikerAPI.** hikerapi.com → регистрация → пополнить на минимальную сумму → скопировать ключ (в чат не присылать).
3. **Ключи в GitHub.** Репозиторий → Settings → Secrets and variables → Actions → New repository secret, три штуки:
   `HIKERAPI_KEY`, `SUPABASE_URL` (Supabase → Settings → API → Project URL),
   `SUPABASE_SERVICE_KEY` (там же, ключ `service_role`).
4. **Ключи в окружении Claude** (чтобы я мог добавлять аккаунты и смотреть отбор из чата):
   те же три — в Environment variables окружения «SynOC»; в Allowed domains добавить
   `api.hikerapi.com` и `*.supabase.co`.
5. **Первые аккаунты** — добавляю я по нише клиента:
   `python3 infra/collector/synoc_collect.py add potapovfx --niche "рост через контент" --client syneps`

## Команды

```bash
python3 infra/collector/synoc_collect.py collect --handle potapovfx --dry-run   # проверка без записи
python3 infra/collector/synoc_collect.py collect                                 # замер всех
python3 infra/collector/synoc_collect.py top --limit 20                          # кандидаты в отбор
```

## Расход (ориентир, сверить с тарифом HikerAPI)

На каждый аккаунт за запуск — 2 запроса (профиль + страница рилсов), первый сбор — 4.
8 запусков в день × N аккаунтов × 2 запроса. 100 аккаунтов ≈ 1600 запросов в день.
Если дорого — реже (каждые 6 ч) или только аккаунты с роликами младше 72 часов.

## Безопасность

- Ключи — только в GitHub Secrets и настройках окружения; в код, коммиты и чат не попадают.
- На всех таблицах включён RLS: анонимный ключ ничего не видит, пишет только `service_role`.
- Instagram напрямую не трогаем — только через HikerAPI (сервис данных).
