import { db } from "@midday/db/client";
import type { MiddlewareHandler } from "hono";

/**
 * Database middleware that connects to the database and sets it on context
 */
export const withDatabase: MiddlewareHandler = async (c, next) => {
  // Use singleton database instance
  c.set("db", db);

  await next();
};
