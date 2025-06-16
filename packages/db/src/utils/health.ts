import { connectDb, primaryDb } from "@db/client";
import { sql } from "drizzle-orm";

export async function checkHealth() {
  const db = await connectDb();
  await db.executeOnReplica(sql`SELECT 1`);
}

export async function checkPrimaryHealth() {
  await primaryDb.execute(sql`SELECT 1`);
}
