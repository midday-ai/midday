import { connectDb } from "@api/db";
import type { MiddlewareHandler } from "hono";

/**
 * Database middleware that connects to the database and sets it on context
 */
export const withScope: MiddlewareHandler = async (c, next) => {
  // Connect to database
  const db = await connectDb();

  // Set database on context
  c.set("db", db);

  await next();
};
