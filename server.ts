import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./server/app";
import { initDatabase } from "./server/db";

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  await initDatabase();

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start server:", error);
  process.exit(1);
});
