import express from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { allowCreation, getLinkByCode, createLink, incrementClicks, isUsingPostgres, type StoredLink } from './db';
import { normalizeUrl } from './url';
export function createExpressApp() {
 const app = express(); app.disable('x-powered-by'); app.use(express.json({ limit: '8kb' }));
 app.get('/s/:code', async (req, res) => {
  try { if (!/^[a-zA-Z0-9_-]{2,30}$/.test(req.params.code)) return res.status(404).send('Lien introuvable.');
   const link = await getLinkByCode(req.params.code); if (!link) return res.status(404).send('Lien introuvable.');
   await incrementClicks(req.params.code); res.set('Cache-Control', 'no-store'); return res.redirect(302, link.originalUrl);
  } catch { return res.status(503).send('Service de redirection indisponible.'); }
 });
 app.post('/api/shorten', async (req, res) => {
  try {
   if (!await allowCreation()) { res.set('Retry-After', '60'); return res.status(429).json({error:'Trop de créations. Réessayez dans une minute.'}); }
   let originalUrl: string; try { originalUrl = normalizeUrl(req.body?.url); } catch (e) { return res.status(400).json({error: e instanceof Error ? e.message : 'URL invalide.'}); }
   const slug = req.body?.customSlug;
   if (slug !== undefined && (typeof slug !== 'string' || !/^[a-zA-Z0-9_-]{2,30}$/.test(slug))) return res.status(400).json({error:'Alias invalide : 2 à 30 lettres, chiffres, tirets ou underscores.'});
   if (req.body?.title !== undefined && typeof req.body.title !== 'string') return res.status(400).json({error:'Titre invalide.'});
   const base = process.env.APP_URL?.replace(/\/$/, '') || (process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.NETLIFY ? 'http://localhost:3000' : '');
   if (!base || !/^https?:\/\//.test(base)) return res.status(503).json({error:'APP_URL doit être configurée sur le domaine public de l’application.'});
   for (let attempt = 0; attempt < 10; attempt++) {
    const shortCode = slug || randomBytes(6).toString('base64url');
    const link: StoredLink = {id: randomUUID(), originalUrl, shortCode, title: req.body?.title?.trim().slice(0,100), clicks: 0, createdAt: new Date().toISOString()};
    try { const saved = await createLink(link); return res.status(201).json({...saved, shortUrl: `${base}/s/${saved.shortCode}`}); }
    catch(e) { if ((e as {code?: string}).code !== '23505') throw e; if (slug) return res.status(409).json({error:'Cet alias est déjà utilisé.'}); }
   }
   return res.status(503).json({error:'Impossible de créer un lien unique. Réessayez.'});
  } catch { return res.status(503).json({error:'Service de liens indisponible. Vérifiez la connexion à la base de données.'}); }
 });
 app.get('/api/health', (_req,res) => res.json({status:'ok', database:isUsingPostgres()?'postgresql':'local_file'}));
 return app;
}
export default createExpressApp();
