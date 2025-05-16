import type { Database } from "@api/db";
import { teams, usersOnTeam } from "@api/db/schema";
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

type CreateTeamParams = {
  name: string;
  userId: string;
  baseCurrency?: string;
};

export const createTeam = async (db: Database, params: CreateTeamParams) => {
  return db.transaction(async (tx) => {
    const [newTeam] = await tx
      .insert(teams)
      .values({ name: params.name, baseCurrency: params.baseCurrency })
      .returning({ id: teams.id });

    if (!newTeam?.id) {
      tx.rollback();
      throw new Error("Failed to create team.");
    }

    await tx.insert(usersOnTeam).values({
      userId: params.userId,
      teamId: newTeam.id,
      role: "owner",
    });

    return newTeam.id;
  });
};
