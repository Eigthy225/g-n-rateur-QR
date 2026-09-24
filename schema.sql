-- Schema SQL pour QR Code & Raccourcisseur d'URL
-- Compatible avec PostgreSQL, Supabase, Neon, Vercel Postgres, Railway

CREATE TABLE IF NOT EXISTS links (
    id VARCHAR(64) PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255),
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_clicked_at TIMESTAMP WITH TIME ZONE
);

-- Index pour recherche rapide par slug
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links (short_code);

-- Index pour trier par date de création
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at DESC);
