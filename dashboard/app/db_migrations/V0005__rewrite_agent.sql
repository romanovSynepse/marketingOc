-- Rewrite-агент: виральные оригиналы → эксперимент с вариантами хуков → победитель → масштаб.
-- Миграция идемпотентная: autodeploy применяет её при каждом деплое.

CREATE TABLE IF NOT EXISTS rewrite_sources (
    id SERIAL PRIMARY KEY,
    url TEXT,
    platform VARCHAR(40),
    author VARCHAR(160),
    title TEXT,
    original_text TEXT,           -- текст поста / транскрипт / описание ролика
    views INTEGER,
    likes INTEGER,
    comments INTEGER,
    author_median_views INTEGER,  -- медиана просмотров автора, если удалось собрать
    virality_x NUMERIC(8,2),      -- views / author_median_views
    pattern JSONB,                -- разбор паттерна от агента
    score INTEGER,                -- 1–10, насколько паттерн стоит брать
    channels VARCHAR(200) DEFAULT 'threads,instagram_reels',
    language VARCHAR(4) DEFAULT 'RU',
    status VARCHAR(20) NOT NULL DEFAULT 'new', -- new | analyzed | experiment | skipped | failed
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiments (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES rewrite_sources(id) ON DELETE SET NULL,
    parent_experiment_id INTEGER REFERENCES experiments(id) ON DELETE SET NULL, -- масштаб победителя
    hypothesis TEXT,
    hook_formula TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- running | decided | scale_requested | scaled
    winner_content_id INTEGER,
    decision TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    decided_at TIMESTAMP
);

ALTER TABLE content_items ADD COLUMN IF NOT EXISTS experiment_id INTEGER REFERENCES experiments(id) ON DELETE SET NULL;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS variant VARCHAR(8);
CREATE INDEX IF NOT EXISTS content_items_experiment_idx ON content_items (experiment_id);
