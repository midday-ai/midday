import type { Database } from "@db/client";
import {
  bankConnections,
  teams,
  transactionCategories,
  users,
  usersOnTeam,
} from "@db/schema";
import {
  CATEGORIES,
  getTaxRateForCategory,
  getTaxTypeForCountry,
} from "@midday/categories";
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
      // subscriptionStatus: teams.subscriptionStatus,
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
      // subscriptionStatus: teams.subscriptionStatus,
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
  switchTeam?: boolean;
};

// Helper function to create system categories for a new team
async function createSystemCategoriesForTeam(
  db: Database,
  teamId: string,
  countryCode: string | null | undefined,
) {
  // Since teams have no previous categories on creation, we can insert all categories directly
  const categoriesToInsert: Array<typeof transactionCategories.$inferInsert> =
    [];

  // First, add all parent categories
  for (const parent of CATEGORIES) {
    const taxRate = getTaxRateForCategory(countryCode, parent.slug);
    const taxType = getTaxTypeForCountry(countryCode);

    categoriesToInsert.push({
      teamId,
      name: parent.name,
      slug: parent.slug,
      color: parent.color,
      system: parent.system,
      excluded: parent.excluded,
      taxRate: taxRate > 0 ? taxRate : null,
      taxType: taxRate > 0 ? taxType : null,
      taxReportingCode: undefined,
      description: undefined,
      parentId: undefined, // Parent categories have no parent
    });
  }

  // Insert all parent categories first
  const insertedParents = await db
    .insert(transactionCategories)
    .values(categoriesToInsert)
    .returning({
      id: transactionCategories.id,
      slug: transactionCategories.slug,
    });

  // Create a map of parent slug to parent ID for child category references
  const parentSlugToId = new Map(
    insertedParents.map((parent) => [parent.slug, parent.id]),
  );

  // Now add all child categories with proper parent references
  const childCategoriesToInsert: Array<
    typeof transactionCategories.$inferInsert
  > = [];

  for (const parent of CATEGORIES) {
    const parentId = parentSlugToId.get(parent.slug);
    if (parentId) {
      for (const child of parent.children) {
        const taxRate = getTaxRateForCategory(countryCode, child.slug);
        const taxType = getTaxTypeForCountry(countryCode);

        childCategoriesToInsert.push({
          teamId,
          name: child.name,
          slug: child.slug,
          color: child.color,
          system: child.system,
          excluded: child.excluded,
          taxRate: taxRate > 0 ? taxRate : null,
          taxType: taxRate > 0 ? taxType : null,
          taxReportingCode: undefined,
          description: undefined,
          parentId: parentId,
        });
      }
    }
  }

  // Insert all child categories
  if (childCategoriesToInsert.length > 0) {
    await db.insert(transactionCategories).values(childCategoriesToInsert);
  }
}

export const createTeam = async (db: Database, params: CreateTeamParams) => {
  try {
    const [newTeam] = await db
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
      throw new Error("Failed to create team.");
    }

    // Add user to team membership
    await db.insert(usersOnTeam).values({
      userId: params.userId,
      teamId: newTeam.id,
      role: "owner",
    });

    // Create system categories for the new team
    await createSystemCategoriesForTeam(db, newTeam.id, params.countryCode);

    // Optionally switch user to the new team
    if (params.switchTeam) {
      await db
        .update(users)
        .set({ teamId: newTeam.id })
        .where(eq(users.id, params.userId));
    }

    return newTeam.id;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create team.");
  }
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
  // Set team_id to null for the user
  await db
    .update(users)
    .set({ teamId: null })
    .where(and(eq(users.id, params.userId), eq(users.teamId, params.teamId)));

  // Delete the user from users_on_team and return the deleted row
  const [deleted] = await db
    .delete(usersOnTeam)
    .where(
      and(
        eq(usersOnTeam.teamId, params.teamId),
        eq(usersOnTeam.userId, params.userId),
      ),
    )
    .returning();

  return deleted;
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
  const [teamMembersCountResult, bankConnectionsCountResult] =
    await Promise.all([
      db.query.usersOnTeam.findMany({
        where: eq(usersOnTeam.teamId, teamId),
        columns: { id: true },
      }),
      db.query.bankConnections.findMany({
        where: eq(bankConnections.teamId, teamId),
        columns: { id: true },
      }),
    ]);

  const teamMembersCount = teamMembersCountResult.length;
  const bankConnectionsCount = bankConnectionsCountResult.length;

  // Can choose starter if team has 2 or fewer members and 2 or fewer bank connections
  const starter = teamMembersCount <= 2 && bankConnectionsCount <= 2;

  // Can always choose pro plan
  return {
    starter,
    pro: true,
  };
}
