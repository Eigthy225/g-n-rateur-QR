import serverless from "serverless-http";
import app from "../../server/app";
import { initDatabase } from "../../server/db";

let databaseReady: Promise<void> | undefined;
const expressHandler = serverless(app);

function initializeDatabase() {
  databaseReady ??= initDatabase().catch((error) => { databaseReady = undefined; throw error; });
  return databaseReady;
}

export const handler = async (event: any, context: any) => {
  try {
    await initializeDatabase();
    return expressHandler(event, context);
  } catch (error) {
    console.error("Database initialization failed:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Le service de liens est indisponible. Vérifiez la variable DATABASE_URL.",
      }),
    };
  }
};
