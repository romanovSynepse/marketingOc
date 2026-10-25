# Synoc Traffic Team: ИИ-команда по трафику

Пять агентов ведут трафик @nickromanov и Syneps AI. Ник утверждает, агенты делают остальное.
Всё складывается в ту же Postgres, что и дашборд: страница **Traffic HQ** (`/traffic`).

| Агент | Что делает | Команда |
|---|---|---|
| Head of Traffic | План на день по каналам, антикризис при просадке, KPI | `plan` |
| Scout (Trend Radar) | Ищет виральные посты и ролики в нише, разбирает паттерны | `scout` |
| Writer / Rewriter | Посты Threads, сценарии Reels/Shorts/TikTok, карусели, TG. Рерайт уровня 2–3 | `write`, `rewrite` |
| Analyst | Победители и проигравшие, узкое место воронки, план на неделю | `report` |
| Outreach | Ресёрч бренда и персональное письмо, отправка только одобренного | `outreach` |

Плюс **Publisher** (Threads через официальный API) и **worker**: автопилот, который утром присылает план
в Telegram, публикует одобренное каждые 15 минут и ночью собирает метрики.

## Мозг
Папка `brain/` подмешивается в системный промпт каждого агента (кэшируется, поэтому дёшево):
- `00_synoc.md`: сюда вставить промпт «Главного маркетолога» из SynOC
- `product.md`: продукт, ICP, кейсы, тарифы, воронка (из head Syneps и Master Context)
- `voice.md`: голос и визуальный стиль @nickromanov, рубрики
- `channels.md`: каналы, дневные нормы, UTM
- `red_lines.md`: что нельзя (клонирование только уровня 2–3, без ферм, без спама)

Правишь markdown, и меняется поведение всей команды. Это и есть обучение мозгов SynOC.

## Запуск
```bash
cp .env.example .env            # ключи: ANTHROPIC_API_KEY, Threads, Telegram
pip install -r requirements.txt
docker compose up -d postgres   # из корня репозитория, миграции применятся сами

python -m synteam plan --telegram                       # план на день
python -m synteam scout --topic "AI UGC видео для брендов"
python -m synteam write --channel threads --count 5     # черновики → Traffic HQ → Approve
python -m synteam rewrite --file viral.txt --channels threads,instagram_reels,youtube_shorts
python -m synteam publish                               # опубликовать одобренное в Threads
python -m synteam sync                                  # метрики Threads
python -m synteam import-metricool data/metricool_instagram_nickromanov.json
python -m synteam report --days 7 --telegram
python -m synteam outreach --csv brands.csv             # brand,website,notes
python -m synteam outreach --send                       # отправить одобренные (лимит в день)
python -m synteam worker                                # автопилот
```

## Threads: как подключить
1. developers.facebook.com → Create App → use case «Access the Threads API».
2. Добавить свой аккаунт Threads тестером, выдать права `threads_basic`, `threads_content_publish`,
   `threads_manage_insights`, `threads_read_replies`, `threads_manage_replies`.
3. Получить long-lived token (60 дней) и положить в `THREADS_ACCOUNTS`. Второй аккаунт добавляется
   вторым ключом в том же JSON.

## Что публикуется как
| Канал | Сейчас | Дальше (опенсорс) |
|---|---|---|
| Threads | официальный API, `publish` | — |
| Instagram, TikTok, YouTube Shorts | Metricool (подключён, публикую через него из чата) | Postiz (self-hosted, AGPL): один API на все сети |
| Telegram | Bot API | aiogram-бот с апрувом кнопками |
| Email-аутрич | SMTP, только одобренные, лимит в день | Listmonk для рассылок по базе с opt-in |

Подробный список опенсорс-инструментов (монтаж, субтитры, аватары, голос): `TOOLS.md`.
