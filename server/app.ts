import express from "express";
import {
  getLinks,
  getLinkByCode,
  createLink,
  incrementClicks,
  deleteLink,
  isUsingPostgres,
  type StoredLink,
} from "./db";

function generateRandomCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

function normalizeUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidUrl(testUrl: string): boolean {
  try {
    const parsed = new URL(testUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getBaseUrl(req: express.Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL") {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  const host = req.get("host") || "localhost:3000";
  const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
  return `${protocol}://${host}`;
}

export function createExpressApp() {
  const app = express();
  app.use(express.json());

  app.get("/s/:code", async (req, res) => {
    try {
      const link = await getLinkByCode(req.params.code);

      if (!link) {
        return res.redirect(`/?error=not_found&code=${encodeURIComponent(req.params.code)}`);
      }

      await incrementClicks(req.params.code);
      return res.redirect(302, link.originalUrl);
    } catch (error) {
      console.error("Error during redirect:", error);
      return res.redirect("/?error=server_error");
    }
  });

  app.post("/api/shorten", async (req, res) => {
    try {
      const { url, customSlug, title } = req.body;

      if (!url || typeof url !== "string" || !url.trim()) {
        return res.status(400).json({ error: "L'URL est requise." });
      }

      const originalUrl = normalizeUrl(url);
      if (!isValidUrl(originalUrl)) {
        return res.status(400).json({ error: "L'URL fournie est invalide." });
      }

      let shortCode: string;
      if (customSlug && typeof customSlug === "string" && customSlug.trim()) {
        shortCode = customSlug.trim();

        if (!/^[a-zA-Z0-9_-]{2,30}$/.test(shortCode)) {
          return res.status(400).json({
            error: "Le slug personnalisé doit contenir entre 2 et 30 caractères alphanumériques (tirets et underscores autorisés).",
          });
        }

        if (await getLinkByCode(shortCode)) {
          return res.status(409).json({
            error: `Le slug personnalisé "${shortCode}" est déjà utilisé. Veuillez en choisir un autre.`,
          });
        }
      } else {
        let attempts = 0;
        do {
          shortCode = generateRandomCode();
          attempts += 1;
        } while ((await getLinkByCode(shortCode)) && attempts < 10);

        if (await getLinkByCode(shortCode)) {
          return res.status(503).json({ error: "Impossible de générer un code unique. Réessayez." });
        }
      }

      const link: StoredLink = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        originalUrl,
        shortCode,
        title: title ? String(title).trim().slice(0, 100) : undefined,
        clicks: 0,
        createdAt: new Date().toISOString(),
      };

      const saved = await createLink(link);
      return res.status(201).json({
        ...saved,
        shortUrl: `${getBaseUrl(req)}/s/${saved.shortCode}`,
      });
    } catch (error) {
      console.error("Error shortening URL:", error);
      return res.status(500).json({ error: "Erreur serveur lors de la création du lien court." });
    }
  });

  app.get("/api/links", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const links = await getLinks();

      return res.json(
        links.map((link) => ({
          ...link,
          shortUrl: `${baseUrl}/s/${link.shortCode}`,
        }))
      );
    } catch (error) {
      console.error("Error retrieving links:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération des liens." });
    }
  });

  app.delete("/api/links/:code", async (req, res) => {
    try {
      const deleted = await deleteLink(req.params.code);
      return deleted
        ? res.json({ success: true })
        : res.status(404).json({ error: "Lien non trouvé." });
    } catch (error) {
      console.error("Error deleting link:", error);
      return res.status(500).json({ error: "Erreur serveur lors de la suppression." });
    }
  });

  app.get("/api/health", async (_req, res) => {
    try {
      const links = await getLinks();
      return res.json({
        status: "ok",
        linksCount: links.length,
        database: isUsingPostgres() ? "postgresql" : "local_file",
      });
    } catch (error) {
      console.error("Healthcheck failed:", error);
      return res.status(503).json({ status: "error", database: "unavailable" });
    }
  });

  return app;
}

const app = createExpressApp();
export default app;
