import serverless from "serverless-http";
import app from "../../server/app";
import { initDatabase } from "../../server/db";

let databaseReady: Promise<void> | undefined;
const handler = serverless(app);

function initializeDatabase() {
  databaseReady ??= initDatabase();
  return databaseReady;
}

export const handler = async (event: Parameters<typeof handler>[0], context: Parameters<typeof handler>[1]) => {
  try {
    await initializeDatabase();
    return handler(event, context);
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
