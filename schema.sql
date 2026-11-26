-- PostgreSQL : compatible avec le schéma du dépôt existant.
CREATE TABLE IF NOT EXISTS links (
 id VARCHAR(64) PRIMARY KEY,
 original_url TEXT NOT NULL,
 short_code VARCHAR(64) UNIQUE NOT NULL,
 title VARCHAR(255),
 clicks INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 last_clicked_at TIMESTAMPTZ
);
-- Si l'index échoue, repérer et résoudre les alias existants qui ne diffèrent que par la casse.
CREATE UNIQUE INDEX IF NOT EXISTS links_code_lower_unique ON links (lower(short_code));
CREATE TABLE IF NOT EXISTS rate_limits (bucket BIGINT PRIMARY KEY, hits INTEGER NOT NULL);
