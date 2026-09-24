import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  initDatabase,
  getLinks,
  getLinkByCode,
  createLink,
  incrementClicks,
  deleteLink,
  isUsingPostgres,
  StoredLink,
} from "./server/db";

function generateRandomCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function normalizeUrl(inputUrl: string): string {
  let trimmed = inputUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }
  return trimmed;
}

function isValidUrl(testUrl: string): boolean {
  try {
    const parsed = new URL(testUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function createExpressApp() {
  const app = express();
  app.use(express.json());

  // Helper to determine base URL
  const getBaseUrl = (req: express.Request): string => {
    if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL") {
      return process.env.APP_URL.replace(/\/$/, "");
    }
    const host = req.get("host") || "localhost:3000";
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
    return `${protocol}://${host}`;
  };

  // Redirection endpoint for shortened URLs: /s/:code
  app.get("/s/:code", async (req, res) => {
    const { code } = req.params;
    try {
      const link = await getLinkByCode(code);

      if (!link) {
        return res.redirect(`/?error=not_found&code=${encodeURIComponent(code)}`);
      }

      // Increment click statistics in background/database
      await incrementClicks(code);

      return res.redirect(302, link.originalUrl);
    } catch (err) {
      console.error("Error during redirect:", err);
      return res.redirect(`/?error=server_error`);
    }
  });

  // API Route: Shorten URL
  app.post("/api/shorten", async (req, res) => {
    try {
      const { url, customSlug, title } = req.body;

      if (!url || typeof url !== "string" || !url.trim()) {
        return res.status(400).json({ error: "L'URL est requise." });
      }

      const normalized = normalizeUrl(url);

      if (!isValidUrl(normalized)) {
        return res.status(400).json({ error: "L'URL fournie est invalide." });
      }

      let shortCode = "";
      if (customSlug && typeof customSlug === "string" && customSlug.trim()) {
        const slug = customSlug.trim();
        // Validation: letters, numbers, hyphens and underscores
        if (!/^[a-zA-Z0-9_-]{2,30}$/.test(slug)) {
          return res.status(400).json({
            error: "Le slug personnalisé doit contenir entre 2 et 30 caractères alphanumériques (tirets et underscores autorisés).",
          });
        }

        // Check availability
        const existing = await getLinkByCode(slug);
        if (existing) {
          return res.status(409).json({
            error: `Le slug personnalisé "${slug}" est déjà utilisé. Veuillez en choisir un autre.`,
          });
        }
        shortCode = slug;
      } else {
        // Auto-generate unique short code
        let attempts = 0;
        do {
          shortCode = generateRandomCode(6);
          attempts++;
        } while ((await getLinkByCode(shortCode)) && attempts < 10);
      }

      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newLink: StoredLink = {
        id,
        originalUrl: normalized,
        shortCode,
        title: title ? String(title).trim().substring(0, 100) : undefined,
        clicks: 0,
        createdAt: new Date().toISOString(),
      };

      const saved = await createLink(newLink);
      const baseUrl = getBaseUrl(req);

      return res.status(201).json({
        ...saved,
        shortUrl: `${baseUrl}/s/${saved.shortCode}`,
      });
    } catch (error) {
      console.error("Error shortening URL:", error);
      return res.status(500).json({ error: "Erreur serveur lors de la création du lien court." });
    }
  });

  // API Route: List all links
  app.get("/api/links", async (req, res) => {
    try {
      const allLinks = await getLinks();
      const baseUrl = getBaseUrl(req);
      const enriched = allLinks.map((link) => ({
        ...link,
        shortUrl: `${baseUrl}/s/${link.shortCode}`,
      }));
      return res.json(enriched);
    } catch (err) {
      console.error("Error fetching links:", err);
      return res.status(500).json({ error: "Erreur lors de la récupération des liens." });
    }
  });

  // API Route: Delete link
  app.delete("/api/links/:code", async (req, res) => {
    const { code } = req.params;
    try {
      const deleted = await deleteLink(code);
      if (deleted) {
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "Lien non trouvé." });
    } catch (err) {
      console.error("Error deleting link:", err);
      return res.status(500).json({ error: "Erreur serveur lors de la suppression." });
    }
  });

  // API Route: Healthcheck & DB status
  app.get("/api/health", async (_req, res) => {
    try {
      const all = await getLinks();
      return res.json({
        status: "ok",
        linksCount: all.length,
        database: isUsingPostgres() ? "postgresql" : "local_file",
      });
    } catch {
      return res.json({ status: "ok", database: isUsingPostgres() ? "postgresql" : "local_file" });
    }
  });

  return app;
}

const app = createExpressApp();

async function startServer() {
  const PORT = 3000;

  // Initialize DB (PostgreSQL if DATABASE_URL is set, otherwise local JSON)
  await initDatabase();

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only bind port if not running in a serverless function runner
  if (!process.env.VERCEL && !process.env.NETLIFY) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Start standalone server
startServer();

export default app;
