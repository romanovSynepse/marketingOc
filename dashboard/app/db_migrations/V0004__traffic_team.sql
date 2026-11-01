-- ИИ-команда по трафику: очередь контента, метрики, оцифровка активностей, аутрич

CREATE TABLE IF NOT EXISTS content_items (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(40) NOT NULL,           -- threads | instagram_reels | instagram_carousel | tiktok | youtube_shorts | telegram ...
    account VARCHAR(80) NOT NULL DEFAULT 'nickromanov',
    format VARCHAR(80),
    rubric VARCHAR(120),
    language VARCHAR(4) DEFAULT 'RU',
    hook TEXT,
    body TEXT,
    cta TEXT,
    visual_brief TEXT,
    pattern TEXT,
    source_url TEXT,
    utm_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft | approved | rejected | published | failed
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    external_id VARCHAR(80),
    permalink TEXT,
    error TEXT,
    created_by_agent VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS content_items_status_idx ON content_items (status, channel);

CREATE TABLE IF NOT EXISTS content_metrics (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES content_items(id) ON DELETE CASCADE,
    collected_at TIMESTAMP DEFAULT NOW(),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    reposts INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    dms INTEGER DEFAULT 0
);

-- Дневные метрики аккаунтов (Threads API, Metricool, ручной ввод)
CREATE TABLE IF NOT EXISTS channel_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    channel VARCHAR(40) NOT NULL,
    account VARCHAR(80) NOT NULL,
    followers INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    profile_visits INTEGER DEFAULT 0,
    link_clicks INTEGER DEFAULT 0,
    UNIQUE (date, channel, account)
);

-- Оцифровка всех мероприятий с трафиком: от поста до оплаты
CREATE TABLE IF NOT EXISTS traffic_activities (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    channel VARCHAR(40) NOT NULL,
    activity VARCHAR(200) NOT NULL,
    campaign VARCHAR(120),
    utm_url TEXT,
    cost INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,      -- заявки на демо / DM по кодовому слову
    signups INTEGER DEFAULT 0,    -- регистрации на syneps.ai
    payments INTEGER DEFAULT 0,
    revenue INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outreach_leads (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(160) NOT NULL,
    website TEXT,
    segment VARCHAR(200),
    fit_score INTEGER DEFAULT 0,
    why_fit TEXT,
    contact TEXT,
    subject TEXT,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new', -- new | drafted | approved | sent | replied | demo | won | lost
    sender_account VARCHAR(120),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_runs (
    id SERIAL PRIMARY KEY,
    agent VARCHAR(40) NOT NULL,
    task TEXT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
