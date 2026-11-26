import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
export interface StoredLink { id: string; originalUrl: string; shortCode: string; title?: string; clicks: number; createdAt: string; lastClickedAt?: string }
const file = path.join(process.cwd(), 'data', 'links.json');
let pool: pg.Pool | null = null;
let fileLinks: StoredLink[] = [];
let localCount = 0; let localWindow = 0;
const fields = `id, original_url AS "originalUrl", short_code AS "shortCode", title, clicks, created_at AS "createdAt", last_clicked_at AS "lastClickedAt"`;
function convert(row: any): StoredLink { return { ...row, createdAt: new Date(row.createdAt).toISOString(), lastClickedAt: row.lastClickedAt ? new Date(row.lastClickedAt).toISOString() : undefined }; }
function save() { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(fileLinks, null, 2)); }
export async function initDatabase() {
 const connectionString = process.env.DATABASE_URL?.trim();
 if (!connectionString) {
  if (process.env.VERCEL || process.env.NETLIFY || process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL requis en production');
  if (fs.existsSync(file)) fileLinks = JSON.parse(fs.readFileSync(file, 'utf8'));
  return;
 }
 const next = new pg.Pool({ connectionString, max: 3, connectionTimeoutMillis: 10000 });
 try {
  await next.query(`CREATE TABLE IF NOT EXISTS links (id VARCHAR(64) PRIMARY KEY, original_url TEXT NOT NULL, short_code VARCHAR(64) UNIQUE NOT NULL, title VARCHAR(255), clicks INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), last_clicked_at TIMESTAMPTZ);
   CREATE UNIQUE INDEX IF NOT EXISTS links_code_lower_unique ON links (lower(short_code));
   CREATE TABLE IF NOT EXISTS rate_limits (bucket BIGINT PRIMARY KEY, hits INTEGER NOT NULL);`);
  pool = next;
 } catch (e) { await next.end(); throw e; }
}
export async function allowCreation(): Promise<boolean> {
 const bucket = Math.floor(Date.now() / 60000);
 if (pool) {
  const result = await pool.query(`INSERT INTO rate_limits (bucket,hits) VALUES ($1,1) ON CONFLICT (bucket) DO UPDATE SET hits=rate_limits.hits+1 RETURNING hits`, [bucket]);
  if (Math.random() < 0.01) await pool.query('DELETE FROM rate_limits WHERE bucket < $1', [bucket - 120]);
  return result.rows[0].hits <= 60;
 }
 if (bucket !== localWindow) { localWindow = bucket; localCount = 0; }
 return ++localCount <= 60;
}
export async function getLinkByCode(code: string): Promise<StoredLink | null> {
 if (pool) { const r = await pool.query(`SELECT ${fields} FROM links WHERE lower(short_code) = lower($1) LIMIT 1`, [code]); return r.rows[0] ? convert(r.rows[0]) : null; }
 return fileLinks.find(x => x.shortCode.toLowerCase() === code.toLowerCase()) ?? null;
}
export async function createLink(link: StoredLink): Promise<StoredLink> {
 if (pool) { const r = await pool.query(`INSERT INTO links (id, original_url, short_code, title, clicks, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${fields}`, [link.id, link.originalUrl, link.shortCode, link.title || null, link.clicks, link.createdAt]); return convert(r.rows[0]); }
 if (await getLinkByCode(link.shortCode)) { const e = new Error('duplicate') as Error & {code: string}; e.code = '23505'; throw e; }
 fileLinks.unshift(link); try { save(); } catch(e) { fileLinks.shift(); throw e; } return link;
}
export async function incrementClicks(code: string): Promise<void> {
 if (pool) { await pool.query('UPDATE links SET clicks=clicks+1, last_clicked_at=NOW() WHERE lower(short_code)=lower($1)', [code]); return; }
 const link = fileLinks.find(x => x.shortCode.toLowerCase() === code.toLowerCase()); if (link) { link.clicks++; link.lastClickedAt = new Date().toISOString(); save(); }
}
export function isUsingPostgres() { return !!pool; }
