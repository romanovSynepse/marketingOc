-- SynOC · шаг 2 «Найти вирусное»: база повторных замеров.
-- Запуск: Supabase → SQL Editor → вставить файл целиком → Run. Повторный запуск безопасен.
-- Формулы: инструкция, раздел 22; docs/SynOC_Reels_Pipeline_DevDoc.pdf, раздел 6.

-- ── Таблицы ────────────────────────────────────────────────────────────────

-- Аккаунты, за которыми следим (ниша клиента, конкуренты, свои).
create table if not exists accounts (
  id            bigserial primary key,
  platform      text not null default 'instagram',
  handle        text not null,                 -- без @, в нижнем регистре
  external_id   text,                          -- pk/user_id в источнике
  niche         text,                          -- «бьюти», «рост через контент»…
  client        text,                          -- для какого бренда собираем (внутренний код)
  role          text not null default 'niche', -- niche | competitor | own
  followers     bigint,
  full_name     text,
  bio           text,
  active        boolean not null default true,
  added_at      timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (platform, handle)
);

-- Ролики (неизменяемые свойства).
create table if not exists reels (
  id            bigserial primary key,
  account_id    bigint not null references accounts(id) on delete cascade,
  platform      text not null default 'instagram',
  shortcode     text not null,                 -- instagram.com/reel/<shortcode>
  external_id   text,
  caption       text,
  duration_s    numeric,
  taken_at      timestamptz not null,          -- дата публикации
  is_pinned     boolean not null default false,
  first_seen_at timestamptz not null default now(),
  unique (platform, shortcode)
);
create index if not exists reels_account_taken on reels (account_id, taken_at desc);

-- Замеры: каждая сборка добавляет строку с текущими цифрами ролика.
create table if not exists snapshots (
  id            bigserial primary key,
  reel_id       bigint not null references reels(id) on delete cascade,
  captured_at   timestamptz not null default now(),
  views         bigint,
  likes         bigint,
  comments      bigint,
  shares        bigint,                        -- пересылки (если источник отдаёт)
  followers     bigint,                        -- подписчики автора в момент замера
  source        text                           -- hikerapi | vidiq | manual …
);
create index if not exists snapshots_reel_time on snapshots (reel_id, captured_at desc);

-- Сценарии: транскрипт и разбор оригинала, рерайт под бренд (шаги 3–4).
create table if not exists scripts (
  id            bigserial primary key,
  reel_id       bigint references reels(id) on delete set null,
  kind          text not null default 'original', -- original | rewrite
  brand         text,
  transcript    text,
  on_screen     text,
  structure     jsonb,                         -- хук, механики удержания, кодовое слово…
  body          text,                          -- текст рерайта
  status        text not null default 'draft', -- draft | approved | produced | published
  created_at    timestamptz not null default now()
);

-- Данные клиентов: доступ только с сервисного ключа (анонимный ключ ничего не видит).
alter table accounts  enable row level security;
alter table reels     enable row level security;
alter table snapshots enable row level security;
alter table scripts   enable row level security;

-- ── Метрики ────────────────────────────────────────────────────────────────

-- Последний замер каждого ролика + возраст.
create or replace view reel_latest with (security_invoker = on) as
select r.*,
       s.captured_at, s.views, s.likes, s.comments, s.shares,
       coalesce(s.followers, a.followers) as followers,
       extract(epoch from (s.captured_at - r.taken_at)) / 3600.0 as age_h
from reels r
join accounts a on a.id = r.account_id
join lateral (
  select * from snapshots s where s.reel_id = r.id order by captured_at desc limit 1
) s on true;

-- Норма автора: медиана последних 30 роликов без закрепов и без «свежих» (< 48 ч).
create or replace view account_baseline with (security_invoker = on) as
select account_id,
       count(*)                                             as n_reels,
       percentile_cont(0.5) within group (order by views)   as median_views,
       percentile_cont(0.5) within group (order by (likes + comments)::numeric / nullif(views, 0))
                                                            as median_er
from (
  select l.*, row_number() over (partition by account_id order by taken_at desc) as rn
  from reel_latest l
  where not is_pinned and age_h >= 48 and views is not null
) t
where rn <= 30
group by account_id;

-- Скорость: прирост просмотров в час между двумя последними замерами
-- и в окнах 6 / 24 / 72 ч после публикации (ближайший замер не позже окна).
create or replace view reel_velocity with (security_invoker = on) as
with s as (
  select s.reel_id, s.captured_at, s.views,
         extract(epoch from (s.captured_at - r.taken_at)) / 3600.0 as age_h,
         lag(s.views)       over w as prev_views,
         lag(s.captured_at) over w as prev_at,
         row_number()       over (partition by s.reel_id order by s.captured_at desc) as rn
  from snapshots s join reels r on r.id = s.reel_id
  window w as (partition by s.reel_id order by s.captured_at)
)
select reel_id,
       max(case when rn = 1 and prev_at is not null
                then (views - prev_views) / greatest(extract(epoch from (captured_at - prev_at)) / 3600.0, 0.1)
           end)                                         as views_per_h_now,
       max(views) filter (where age_h <= 6)             as views_6h,
       max(views) filter (where age_h <= 24)            as views_24h,
       max(views) filter (where age_h <= 72)            as views_72h,
       count(*)                                         as n_snapshots
from s
group by reel_id;

-- Итоговая оценка ролика: все формулы раздела 22 в одном месте.
create or replace view reel_scores with (security_invoker = on) as
select a.handle, a.niche, a.client, a.role,
       l.id as reel_id, l.shortcode,
       'https://www.instagram.com/reel/' || l.shortcode || '/' as url,
       l.taken_at, round(l.age_h::numeric, 1) as age_h, l.is_pinned,
       l.views, l.likes, l.comments, l.shares, l.followers,
       b.median_views,
       round((l.views / nullif(b.median_views, 0))::numeric, 2)                 as outlier_x,     -- выше нормы
       round((l.views::numeric / nullif(l.followers, 0)), 3)                    as views_per_follower, -- аномалия
       round(((l.likes + l.comments)::numeric / nullif(l.views, 0)) * 100, 2)   as er_pct,
       round((l.comments::numeric / nullif(l.likes, 0)), 2)                     as comments_per_like,
       round(v.views_per_h_now::numeric, 0)                                     as views_per_h_now,
       round((l.views / greatest(l.age_h, 1))::numeric, 0)                      as views_per_h_avg,
       v.views_6h, v.views_24h, v.views_72h, v.n_snapshots,
       -- накрутка: ER ниже трети нормы автора при просмотрах выше нормы (порог — ориентир, уточнить на данных)
       ( l.views > coalesce(b.median_views, 0)
         and (l.likes + l.comments)::numeric / nullif(l.views, 0) < coalesce(b.median_er, 0) / 3 ) as suspect_fake,
       l.caption
from reel_latest l
join accounts a on a.id = l.account_id
left join account_baseline b on b.account_id = l.account_id
left join reel_velocity v on v.reel_id = l.id;

-- Кандидаты в отбор: > 3× нормы автора, не закреп, не накрутка.
create or replace view outliers with (security_invoker = on) as
select * from reel_scores
where outlier_x >= 3 and not is_pinned and not coalesce(suspect_fake, false)
order by outlier_x desc;
