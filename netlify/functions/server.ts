import serverless from "serverless-http";
import app from "../../server";
import { initDatabase } from "../../server/db";

let dbInitialized = false;
const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
  return serverlessHandler(event, context);
};
