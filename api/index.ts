import type { Request, Response } from "express";
import app from "../server/app";
import { initDatabase } from "../server/db";

let databaseReady: Promise<void> | undefined;

function initializeDatabase() {
  databaseReady ??= initDatabase().catch((error) => { databaseReady = undefined; throw error; });
  return databaseReady;
}

export default async function handler(req: Request, res: Response) {
  try {
    await initializeDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Database initialization failed:", error);
    return res.status(500).json({
      error: "Le service de liens est indisponible. Vérifiez la variable DATABASE_URL.",
    });
  }
}
