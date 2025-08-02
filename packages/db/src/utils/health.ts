import { connectDb } from "@db/client";
import { sql } from "drizzle-orm";

export async function checkHealth() {
  const db = await connectDb();
  await db.executeOnReplica(sql`SELECT 1`);
}
