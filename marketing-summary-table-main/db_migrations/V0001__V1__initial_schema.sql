-- Клиенты и проекты
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    segment VARCHAR(50) NOT NULL DEFAULT 'B2B',
    status VARCHAR(50) NOT NULL DEFAULT 'Новый',
    project VARCHAR(100),
    budget INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    ltv INTEGER DEFAULT 0,
    manager VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Блогеры/инфлюенсеры
CREATE TABLE influencers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    reach INTEGER DEFAULT 0,
    cpm INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Планируется',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Еженедельная статистика маркетинга
CREATE TABLE marketing_weekly_stats (
    id SERIAL PRIMARY KEY,
    week VARCHAR(50) NOT NULL,
    budget INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    cpl INTEGER DEFAULT 0,
    romi INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- KPI план/факт
CREATE TABLE marketing_kpi (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    plan INTEGER DEFAULT 0,
    fact INTEGER DEFAULT 0,
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Каналы продвижения
CREATE TABLE marketing_channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    value INTEGER DEFAULT 0,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- RFM-сегменты
CREATE TABLE rfm_segments (
    id SERIAL PRIMARY KEY,
    segment VARCHAR(100) NOT NULL,
    clients_count INTEGER DEFAULT 0,
    revenue BIGINT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Этапы CJM
CREATE TABLE customer_journey_stages (
    id SERIAL PRIMARY KEY,
    sort_order INTEGER DEFAULT 0,
    stage VARCHAR(100) NOT NULL,
    touchpoint VARCHAR(100),
    emotion VARCHAR(100),
    action VARCHAR(100),
    problem VARCHAR(200),
    solution VARCHAR(200),
    metric VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- SWOT-анализ
CREATE TABLE swot_items (
    id SERIAL PRIMARY KEY,
    quadrant CHAR(1) NOT NULL CHECK (quadrant IN ('S','W','O','T')),
    content TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PEST-анализ
CREATE TABLE pest_items (
    id SERIAL PRIMARY KEY,
    factor VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SMART-цели
CREATE TABLE smart_goals (
    id SERIAL PRIMARY KEY,
    goal VARCHAR(200) NOT NULL,
    specific TEXT,
    measurable VARCHAR(100),
    achievable VARCHAR(100),
    relevant VARCHAR(200),
    time_bound VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Новый',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Сегменты ЦА
CREATE TABLE target_audience_segments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    age VARCHAR(50),
    geo VARCHAR(200),
    pain TEXT,
    income VARCHAR(100),
    channel VARCHAR(200),
    size VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Медиаплан
CREATE TABLE mediaplan (
    id SERIAL PRIMARY KEY,
    week VARCHAR(50),
    channel VARCHAR(100) NOT NULL,
    format VARCHAR(100),
    theme VARCHAR(200),
    responsible VARCHAR(100),
    budget INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Планируется',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Матрица контента
CREATE TABLE content_matrix (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    formats TEXT,
    goal VARCHAR(200),
    frequency VARCHAR(100),
    examples TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Продукты/юнит-экономика
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    variable_cost DECIMAL(10,2) DEFAULT 0,
    cac DECIMAL(10,2) DEFAULT 0,
    fixed_cost DECIMAL(10,2) DEFAULT 0,
    qty INTEGER DEFAULT 0,
    ltv DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
