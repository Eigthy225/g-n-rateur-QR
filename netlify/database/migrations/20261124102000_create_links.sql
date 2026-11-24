CREATE TABLE IF NOT EXISTS links (
  id VARCHAR(64) PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_code VARCHAR(64) UNIQUE NOT NULL,
  title VARCHAR(255),
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_clicked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_links_short_code ON links (short_code);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at DESC);
