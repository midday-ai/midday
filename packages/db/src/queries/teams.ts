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
  // Get all existing categories for this team
  const existingCategories = await db
    .select({
      id: transactionCategories.id,
      slug: transactionCategories.slug,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(eq(transactionCategories.teamId, teamId));

  const existingSlugs = new Set(existingCategories.map((cat) => cat.slug));

  // Only create categories that don't already exist
  const categoriesToInsert: Array<typeof transactionCategories.$inferInsert> =
    [];

  // Flatten all categories (parents and children)
  for (const parent of CATEGORIES) {
    // Add parent category if it doesn't exist
    if (!existingSlugs.has(parent.slug)) {
      categoriesToInsert.push({
        teamId,
        name: parent.name,
        slug: parent.slug,
        color: parent.color,
        system: parent.system,
        excluded: parent.excluded,
        taxRate: getTaxRateForCategory(countryCode, parent.slug),
        taxType: getTaxTypeForCountry(countryCode),
        taxReportingCode: undefined,
        description: undefined,
        parentId: undefined, // Parent categories have no parent
      });
    }

    // Add child categories if they don't exist
    for (const child of parent.children) {
      if (!existingSlugs.has(child.slug)) {
        categoriesToInsert.push({
          teamId,
          name: child.name,
          slug: child.slug,
          color: child.color,
          system: child.system,
          excluded: child.excluded,
          taxRate: getTaxRateForCategory(countryCode, child.slug),
          taxType: getTaxTypeForCountry(countryCode),
          taxReportingCode: undefined,
          description: undefined,
          parentId: undefined, // We'll set this after creating all categories
        });
      }
    }
  }

  // Create missing categories if any
  if (categoriesToInsert.length > 0) {
    await db.insert(transactionCategories).values(categoriesToInsert);
  }

  // Now ensure ALL categories have proper parent-child relationships
  // This handles both existing categories (from PG trigger) and newly created ones
  const allCategories = await db
    .select({
      id: transactionCategories.id,
      slug: transactionCategories.slug,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(eq(transactionCategories.teamId, teamId));

  // Build the complete parent-child structure as defined in categories.ts
  const parentCategoryMap = new Map();
  const childCategoriesToUpdate: Array<{
    id: string;
    slug: string;
    parentSlug: string;
  }> = [];

  // First pass: identify all parent categories and map their IDs
  for (const category of allCategories) {
    const parentCategory = CATEGORIES.find((p) => p.slug === category.slug);
    if (parentCategory?.children) {
      // This is a parent category (has children)
      parentCategoryMap.set(parentCategory.slug, category.id);
    }
  }

  // Second pass: identify all child categories that need parentId updates
  for (const category of allCategories) {
    if (!category.slug) continue; // Skip categories without slugs

    const parentCategory = CATEGORIES.find((p) =>
      p.children.some((c) => c.slug === category.slug),
    );
    if (parentCategory?.slug) {
      // This is a child category
      const expectedParentId = parentCategoryMap.get(parentCategory.slug);

      if (expectedParentId && category.parentId !== expectedParentId) {
        childCategoriesToUpdate.push({
          id: category.id,
          slug: category.slug,
          parentSlug: parentCategory.slug,
        });
      }
    }
  }

  // Update all child categories with correct parentIds
  for (const child of childCategoriesToUpdate) {
    const parentId = parentCategoryMap.get(child.parentSlug);
    if (parentId) {
      await db
        .update(transactionCategories)
        .set({ parentId })
        .where(eq(transactionCategories.id, child.id));
    }
  }

  // Verify the final structure
  const finalCategories = await db
    .select({
      id: transactionCategories.id,
      slug: transactionCategories.slug,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(eq(transactionCategories.teamId, teamId));

  const finalParentCount = finalCategories.filter(
    (cat) => cat.parentId === null,
  ).length;
  const finalChildCount = finalCategories.filter(
    (cat) => cat.parentId !== null,
  ).length;
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
