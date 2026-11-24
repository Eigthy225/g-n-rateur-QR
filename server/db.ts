import fs from "fs";
import path from "path";
import pg from "pg";

const { Pool } = pg;

export interface StoredLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  title?: string;
  clicks: number;
  createdAt: string;
  lastClickedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "links.json");

let pool: pg.Pool | null = null;
let usePostgres = false;

// Fallback in-memory cache when not using PostgreSQL
let fileLinks: StoredLink[] = [];

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      fileLinks = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not load stored links file:", err);
    fileLinks = [];
  }
}

function saveFileLinks() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(fileLinks, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save links to disk:", err);
  }
}

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
}

export async function initDatabase(options: { requirePersistentDatabase?: boolean } = {}): Promise<void> {
  const dbUrl = getDatabaseUrl();

  if (dbUrl) {
    try {
      console.log("Connecting to PostgreSQL database...");
      pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes("localhost") ? false : { rejectUnauthorized: true },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Initialise the schema on the external PostgreSQL provider. The queries
      // are idempotent, so they are safe on every serverless cold start.
      const client = await pool.connect();
      try {
        await client.query(`
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
        `);
        usePostgres = true;
        console.log("PostgreSQL database connected and schema initialized successfully!");
      } finally {
        client.release();
      }
      return;
    } catch (err) {
      console.error("Failed to connect to PostgreSQL. Falling back to local file storage:", err);
      if (options.requirePersistentDatabase) {
        throw new Error("A persistent PostgreSQL database is required and must be reachable.");
      }
      usePostgres = false;
      pool = null;
    }
  }

  if (options.requirePersistentDatabase) {
    throw new Error("A persistent PostgreSQL database is required for serverless deployments.");
  }

  // Fallback to file storage
  console.log("Using local JSON file storage (data/links.json). Set DATABASE_URL to use PostgreSQL.");
  ensureDataFile();
}

export async function getLinks(): Promise<StoredLink[]> {
  if (usePostgres && pool) {
    try {
      const res = await pool.query(`
        SELECT id, original_url as "originalUrl", short_code as "shortCode",
               title, clicks, created_at as "createdAt", last_clicked_at as "lastClickedAt"
        FROM links
        ORDER BY created_at DESC
      `);
      return res.rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt).toISOString(),
        lastClickedAt: row.lastClickedAt ? new Date(row.lastClickedAt).toISOString() : undefined,
      }));
    } catch (err) {
      console.error("Error querying PostgreSQL links:", err);
    }
  }

  return [...fileLinks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getLinkByCode(code: string): Promise<StoredLink | null> {
  if (usePostgres && pool) {
    try {
      const res = await pool.query(
        `
        SELECT id, original_url as "originalUrl", short_code as "shortCode",
               title, clicks, created_at as "createdAt", last_clicked_at as "lastClickedAt"
        FROM links
        WHERE LOWER(short_code) = LOWER($1)
        LIMIT 1
      `,
        [code]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          ...row,
          createdAt: new Date(row.createdAt).toISOString(),
          lastClickedAt: row.lastClickedAt ? new Date(row.lastClickedAt).toISOString() : undefined,
        };
      }
      return null;
    } catch (err) {
      console.error("Error finding link in PostgreSQL:", err);
    }
  }

  const found = fileLinks.find((l) => l.shortCode.toLowerCase() === code.toLowerCase());
  return found || null;
}

export async function createLink(link: StoredLink): Promise<StoredLink> {
  if (usePostgres && pool) {
    try {
      const res = await pool.query(
        `
        INSERT INTO links (id, original_url, short_code, title, clicks, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, original_url as "originalUrl", short_code as "shortCode",
                  title, clicks, created_at as "createdAt", last_clicked_at as "lastClickedAt"
      `,
        [link.id, link.originalUrl, link.shortCode, link.title || null, link.clicks || 0, link.createdAt]
      );
      const row = res.rows[0];
      return {
        ...row,
        createdAt: new Date(row.createdAt).toISOString(),
        lastClickedAt: row.lastClickedAt ? new Date(row.lastClickedAt).toISOString() : undefined,
      };
    } catch (err) {
      console.error("Error creating link in PostgreSQL:", err);
      throw err;
    }
  }

  fileLinks.unshift(link);
  saveFileLinks();
  return link;
}

export async function incrementClicks(code: string): Promise<void> {
  const now = new Date().toISOString();
  if (usePostgres && pool) {
    try {
      await pool.query(
        `
        UPDATE links
        SET clicks = clicks + 1, last_clicked_at = $1
        WHERE LOWER(short_code) = LOWER($2)
      `,
        [now, code]
      );
      return;
    } catch (err) {
      console.error("Error updating clicks in PostgreSQL:", err);
    }
  }

  const link = fileLinks.find((l) => l.shortCode.toLowerCase() === code.toLowerCase());
  if (link) {
    link.clicks += 1;
    link.lastClickedAt = now;
    saveFileLinks();
  }
}

export async function deleteLink(code: string): Promise<boolean> {
  if (usePostgres && pool) {
    try {
      const res = await pool.query(
        `DELETE FROM links WHERE LOWER(short_code) = LOWER($1)`,
        [code]
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("Error deleting link from PostgreSQL:", err);
      return false;
    }
  }

  const initialLen = fileLinks.length;
  fileLinks = fileLinks.filter((l) => l.shortCode.toLowerCase() !== code.toLowerCase());
  if (fileLinks.length !== initialLen) {
    saveFileLinks();
    return true;
  }
  return false;
}

export function isUsingPostgres(): boolean {
  return usePostgres;
}
