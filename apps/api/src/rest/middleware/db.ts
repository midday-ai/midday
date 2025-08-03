import { connectDb } from "@midday/db/client";
import type { MiddlewareHandler } from "hono";

/**
 * Database middleware that connects to the database and sets it on context
 */
export const withDatabase: MiddlewareHandler = async (c, next) => {
  // Connect to database
  const db = await connectDb();

  // Set database on context
  c.set("db", db);

  await next();
};
