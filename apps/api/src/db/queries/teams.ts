import type { Database } from "@api/db";
import { teams } from "@api/db/schema";
import { eq } from "drizzle-orm";

export const getTeamById = async (db: Database, id: string) => {
  const [result] = await db
    .select({
      id: teams.id,
      name: teams.name,
      logoUrl: teams.logoUrl,
      email: teams.email,
      inboxId: teams.inboxId,
      plan: teams.plan,
      baseCurrency: teams.baseCurrency,
    })
    .from(teams)
    .where(eq(teams.id, id));

  return result;
};

export const updateTeamById = async (
  db: Database,
  { id, data }: { id: string; data: Partial<typeof teams.$inferInsert> },
) => {
  const [result] = await db
    .update(teams)
    .set(data)
    .where(eq(teams.id, id))
    .returning();

  return result;
};
