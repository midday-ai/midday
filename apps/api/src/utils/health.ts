import { sql } from "drizzle-orm";
import { connectDb } from "../db";
import { users } from "../db/schema";

export async function checkHealth() {
  const db = await connectDb();
  await db.select({ count: sql`count(*)`.mapWith(Number) }).from(users);
}
