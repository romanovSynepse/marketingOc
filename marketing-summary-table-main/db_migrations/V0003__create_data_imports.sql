
CREATE TABLE t_p91418528_marketing_summary_ta.data_imports (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'csv',
  status TEXT NOT NULL DEFAULT 'pending',
  row_count INTEGER DEFAULT 0,
  columns JSONB DEFAULT '[]',
  preview JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
