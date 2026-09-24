import type { Request, Response } from "express";
import app from "../server";
import { initDatabase } from "../server/db";

let dbInitialized = false;

export default async function handler(req: Request, res: Response) {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
  return app(req, res);
}
