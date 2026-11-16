CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL,              -- 'estimator' | 'contact'
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  homeowner TEXT,
  monthly_bill REAL,
  timeline TEXT,
  message TEXT,
  estimate_json TEXT,                -- our own computed estimate, not Google content
  score TEXT,                        -- hot | warm | cold
  consent_text TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  page_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);
