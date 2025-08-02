import type { Database } from "@db/client";
import { bankConnections, teams, users, usersOnTeam } from "@db/schema";
import { and, eq } from "drizzle-orm";

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
      countryCode: teams.countryCode,
    })
    .from(teams)
    .where(eq(teams.id, id));

  return result;
};

type UpdateTeamParams = {
  id: string;
  data: Partial<typeof teams.$inferInsert>;
};

export const updateTeamById = async (
  db: Database,
  params: UpdateTeamParams,
) => {
  const { id, data } = params;

  const [result] = await db
    .update(teams)
    .set(data)
    .where(eq(teams.id, id))
    .returning({
      id: teams.id,
      name: teams.name,
      logoUrl: teams.logoUrl,
      email: teams.email,
      inboxId: teams.inboxId,
      plan: teams.plan,
      baseCurrency: teams.baseCurrency,
      countryCode: teams.countryCode,
    });

  return result;
};

type CreateTeamParams = {
  name: string;
  userId: string;
  email: string;
  baseCurrency?: string;
  countryCode?: string;
  logoUrl?: string;
};

export const createTeam = async (db: Database, params: CreateTeamParams) => {
  return db.transaction(async (tx) => {
    const [newTeam] = await tx
      .insert(teams)
      .values({
        name: params.name,
        baseCurrency: params.baseCurrency,
        countryCode: params.countryCode,
        logoUrl: params.logoUrl,
        email: params.email,
      })
      .returning({ id: teams.id });

    if (!newTeam?.id) {
      tx.rollback();
      throw new Error("Failed to create team.");
    }

    // Add user to team membership
    await tx.insert(usersOnTeam).values({
      userId: params.userId,
      teamId: newTeam.id,
      role: "owner",
    });

    // Set the user's teamId
    await tx
      .update(users)
      .set({ teamId: newTeam.id })
      .where(eq(users.id, params.userId));

    return newTeam.id;
  });
};

export async function getTeamMembers(db: Database, teamId: string) {
  const result = await db
    .select({
      id: usersOnTeam.id,
      role: usersOnTeam.role,
      team_id: usersOnTeam.teamId,
      user: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        email: users.email,
      },
    })
    .from(usersOnTeam)
    .innerJoin(users, eq(usersOnTeam.userId, users.id))
    .where(eq(usersOnTeam.teamId, teamId))
    .orderBy(usersOnTeam.createdAt);

  return result.map((item) => ({
    id: item.user.id,
    role: item.role,
    fullName: item.user.fullName,
    avatarUrl: item.user.avatarUrl,
    email: item.user.email,
  }));
}

type LeaveTeamParams = {
  userId: string;
  teamId: string;
};

export async function leaveTeam(db: Database, params: LeaveTeamParams) {
  return db.transaction(async (tx) => {
    // Set team_id to null for the user
    await tx
      .update(users)
      .set({ teamId: null })
      .where(and(eq(users.id, params.userId), eq(users.teamId, params.teamId)));

    // Delete the user from users_on_team and return the deleted row
    const [deleted] = await tx
      .delete(usersOnTeam)
      .where(
        and(
          eq(usersOnTeam.teamId, params.teamId),
          eq(usersOnTeam.userId, params.userId),
        ),
      )
      .returning();

    return deleted;
  });
}

export async function deleteTeam(db: Database, id: string) {
  const [result] = await db.delete(teams).where(eq(teams.id, id)).returning({
    id: teams.id,
  });

  return result;
}

type DeleteTeamMemberParams = {
  userId: string;
  teamId: string;
};

export async function deleteTeamMember(
  db: Database,
  params: DeleteTeamMemberParams,
) {
  const [deleted] = await db
    .delete(usersOnTeam)
    .where(
      and(
        eq(usersOnTeam.userId, params.userId),
        eq(usersOnTeam.teamId, params.teamId),
      ),
    )
    .returning();

  return deleted;
}

type UpdateTeamMemberParams = {
  userId: string;
  teamId: string;
  role: "owner" | "member";
};

export async function updateTeamMember(
  db: Database,
  params: UpdateTeamMemberParams,
) {
  const { userId, teamId, role } = params;

  const [updated] = await db
    .update(usersOnTeam)
    .set({ role })
    .where(and(eq(usersOnTeam.userId, userId), eq(usersOnTeam.teamId, teamId)))
    .returning();

  return updated;
}

type GetAvailablePlansResult = {
  starter: boolean;
  pro: boolean;
};

export async function getAvailablePlans(
  db: Database,
  teamId: string,
): Promise<GetAvailablePlansResult> {
  return db.transaction(async (tx) => {
    // Count team members
    const teamMembersCountResult = await tx.query.usersOnTeam.findMany({
      where: eq(usersOnTeam.teamId, teamId),
      columns: { id: true },
    });
    const teamMembersCount = teamMembersCountResult.length;

    // Count bank connections
    const bankConnectionsCountResult = await tx.query.bankConnections.findMany({
      where: eq(bankConnections.teamId, teamId),
      columns: { id: true },
    });

    const bankConnectionsCount = bankConnectionsCountResult.length;

    // Can choose starter if team has 2 or fewer members and 2 or fewer bank connections
    const starter = teamMembersCount <= 2 && bankConnectionsCount <= 2;

    // Can always choose pro plan
    return {
      starter,
      pro: true,
    };
  });
}
