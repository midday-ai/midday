import { sql } from "drizzle-orm";
import { connectDb } from "../db";

export async function checkHealth() {
  const db = await connectDb();
  await db.executeOnReplica(sql`SELECT 1`);
}
