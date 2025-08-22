import { connectDb } from "@midday/db/client";
import { initializeEventSystem } from "@midday/notifications";
import type { MiddlewareHandler } from "hono";

/**
 * Database middleware that connects to the database and sets it on context
 */
export const withDatabase: MiddlewareHandler = async (c, next) => {
  // Connect to database
  const db = await connectDb();

  // Initialize event system with database
  const events = initializeEventSystem(db);

  // Set database and events on context
  c.set("db", db);
  c.set("events", events);

  await next();
};
