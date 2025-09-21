import { sql } from "drizzle-orm";
import { db } from "../client";

export async function checkHealth() {
  await db.executeOnReplica(sql`SELECT 1`);
}
