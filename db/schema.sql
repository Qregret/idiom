CREATE TABLE IF NOT EXISTS idioms (
  word TEXT PRIMARY KEY,
  order_index INTEGER NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  frequency INTEGER NOT NULL DEFAULT 0,
  exact_frequency INTEGER,
  min_frequency INTEGER NOT NULL DEFAULT 0,
  reliability_level TEXT NOT NULL DEFAULT 'C',
  confidence NUMERIC(4, 2) NOT NULL DEFAULT 0.50,
  occurrence_count INTEGER NOT NULL DEFAULT 0,
  source_site_count INTEGER NOT NULL DEFAULT 0,
  priority_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
  frequency_basis TEXT NOT NULL DEFAULT '',
  source_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idioms_priority
  ON idioms (reliability_level, priority_score DESC, frequency DESC);

CREATE TABLE IF NOT EXISTS visitor_settings (
  ip TEXT PRIMARY KEY,
  daily_target INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitor_word_progress (
  ip TEXT NOT NULL,
  word TEXT NOT NULL REFERENCES idioms(word) ON DELETE CASCADE,
  remembered BOOLEAN,
  learned_at TIMESTAMPTZ,
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  favorited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ip, word)
);

CREATE INDEX IF NOT EXISTS idx_progress_ip_learned
  ON visitor_word_progress (ip, learned_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_ip_favorite
  ON visitor_word_progress (ip, favorite);
