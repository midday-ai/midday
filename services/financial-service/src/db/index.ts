import { HonoEnv } from '@/hono/env';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { Context as HonoContext } from "hono";
import * as schema from "./schema";

// Use a single schema import and type
export type Schema = typeof schema;

// Consistent use of DrizzleD1Database type
export type DrizzleDB = DrizzleD1Database<Schema>;

// Enhance initDB function with better typing
export function initDB(d1: D1Database): DrizzleDB {
  return drizzle(d1, { schema });
}

// Improve getDB function with explicit return type
export const getDB = (context: HonoContext<HonoEnv>): DrizzleDB => {
  return drizzle(context.env.DB, { schema });
};
