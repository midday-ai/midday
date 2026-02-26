import type { Database } from "@db/client";
import { teams, users, usersOnTeam } from "@db/schema";
import { eq } from "drizzle-orm";

export async function getTeamMembersByTeamId(db: Database, teamId: string) {
  return db
    .select({
      id: usersOnTeam.id,
      role: usersOnTeam.role,
      teamId: usersOnTeam.teamId,
      user: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        email: users.email,
      },
    })
    .from(usersOnTeam)
    .leftJoin(users, eq(usersOnTeam.userId, users.id))
    .where(eq(usersOnTeam.teamId, teamId))
    .orderBy(usersOnTeam.createdAt);
}

export async function getTeamsByUserId(db: Database, userId: string) {
  const result = await db
    .select({
      id: usersOnTeam.id,
      role: usersOnTeam.role,
      teamId: usersOnTeam.teamId,
      team: {
        id: teams.id,
        name: teams.name,
        plan: teams.plan,
        role: usersOnTeam.role,
        createdAt: teams.createdAt,
        logoUrl: teams.logoUrl,
      },
    })
    .from(usersOnTeam)
    .leftJoin(teams, eq(usersOnTeam.teamId, teams.id))
    .where(eq(usersOnTeam.userId, userId))
    .orderBy(usersOnTeam.createdAt);

  if (!result) {
    return [];
  }

  // Deduplicate by team ID — the users_on_team PK includes a random `id` column,
  // so duplicate memberships for the same (user_id, team_id) can exist in the DB.
  const seen = new Set<string>();
  return result
    .filter((row) => {
      const teamId = row?.team?.id;
      if (!teamId || seen.has(teamId)) return false;
      seen.add(teamId);
      return true;
    })
    .map((row) => ({
      id: row?.team?.id,
      name: row?.team?.name,
      plan: row?.team?.plan,
      role: row?.role,
      createdAt: row?.team?.createdAt,
      updatedAt: row?.team?.createdAt,
      logoUrl: row?.team?.logoUrl,
    }));
}
