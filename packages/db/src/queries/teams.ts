import {
  CATEGORIES,
  getTaxRateForCategory,
  getTaxTypeForCountry,
} from "@midday/categories";
import { subDays } from "date-fns";
import { and, eq, gt, gte, inArray, isNotNull, isNull, or } from "drizzle-orm";
import type { Database } from "../client";
import {
  bankConnections,
  teams,
  transactionCategories,
  users,
  usersOnTeam,
} from "../schema";

export const hasTeamAccess = async (
  db: Database,
  teamId: string,
  userId: string,
): Promise<boolean> => {
  const result = await db
    .select({ teamId: usersOnTeam.teamId })
    .from(usersOnTeam)
    .where(and(eq(usersOnTeam.teamId, teamId), eq(usersOnTeam.userId, userId)))
    .limit(1);

  return result.length > 0;
};

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
      fiscalYearStartMonth: teams.fiscalYearStartMonth,
      exportSettings: teams.exportSettings,
      stripeAccountId: teams.stripeAccountId,
      stripeConnectStatus: teams.stripeConnectStatus,
    })
    .from(teams)
    .where(eq(teams.id, id));

  return result;
};

export const getTeamByInboxId = async (db: Database, inboxId: string) => {
  const [result] = await db
    .select({
      id: teams.id,
      name: teams.name,
      email: teams.email,
    })
    .from(teams)
    .where(eq(teams.inboxId, inboxId))
    .limit(1);

  return result;
};

/**
 * Get a team by their Stripe Connect account ID.
 * Used by webhooks to find which team a connected account belongs to.
 *
 * @param db - Database instance
 * @param stripeAccountId - The Stripe connected account ID (acct_xxx)
 * @returns The team if found, undefined otherwise
 */
export const getTeamByStripeAccountId = async (
  db: Database,
  stripeAccountId: string,
) => {
  const [result] = await db
    .select({
      id: teams.id,
      name: teams.name,
      stripeAccountId: teams.stripeAccountId,
      stripeConnectStatus: teams.stripeConnectStatus,
    })
    .from(teams)
    .where(eq(teams.stripeAccountId, stripeAccountId))
    .limit(1);

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
      fiscalYearStartMonth: teams.fiscalYearStartMonth,
    });

  return result;
};

type CreateTeamParams = {
  name: string;
  userId: string;
  email: string;
  baseCurrency?: string;
  countryCode?: string;
  fiscalYearStartMonth?: number | null;
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
  const startTime = Date.now();
  const teamCreationId = `team_creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(
    `[${teamCreationId}] Starting team creation for user ${params.userId}`,
    {
      teamName: params.name,
      baseCurrency: params.baseCurrency,
      countryCode: params.countryCode,
      email: params.email,
      switchTeam: params.switchTeam,
      timestamp: new Date().toISOString(),
    },
  );

  // Use transaction to ensure atomicity and prevent race conditions
  const teamId = await db.transaction(async (tx) => {
    try {
      // Check if user already has teams to prevent duplicate creation
      const existingTeams = await tx
        .select({ id: teams.id, name: teams.name })
        .from(usersOnTeam)
        .innerJoin(teams, eq(teams.id, usersOnTeam.teamId))
        .where(eq(usersOnTeam.userId, params.userId));

      console.log(
        `[${teamCreationId}] User existing teams count: ${existingTeams.length}`,
        {
          existingTeams: existingTeams.map((t) => ({ id: t.id, name: t.name })),
        },
      );

      // Create the team
      console.log(`[${teamCreationId}] Creating team record`);
      const [newTeam] = await tx
        .insert(teams)
        .values({
          name: params.name,
          baseCurrency: params.baseCurrency,
          countryCode: params.countryCode,
          fiscalYearStartMonth: params.fiscalYearStartMonth,
          logoUrl: params.logoUrl,
          email: params.email,
        })
        .returning({ id: teams.id });

      if (!newTeam?.id) {
        throw new Error("Failed to create team.");
      }

      console.log(
        `[${teamCreationId}] Team created successfully with ID: ${newTeam.id}`,
      );

      // Add user to team membership (atomic with team creation)
      console.log(`[${teamCreationId}] Adding user to team membership`);
      await tx.insert(usersOnTeam).values({
        userId: params.userId,
        teamId: newTeam.id,
        role: "owner",
      });

      // Create system categories for the new team (atomic)
      console.log(`[${teamCreationId}] Creating system categories`);
      // @ts-expect-error - tx is a PgTransaction
      await createSystemCategoriesForTeam(tx, newTeam.id, params.countryCode);

      // Optionally switch user to the new team (atomic)
      if (params.switchTeam) {
        console.log(`[${teamCreationId}] Switching user to new team`);
        await tx
          .update(users)
          .set({ teamId: newTeam.id })
          .where(eq(users.id, params.userId));
      }

      const duration = Date.now() - startTime;
      console.log(
        `[${teamCreationId}] Team creation completed successfully in ${duration}ms`,
        {
          teamId: newTeam.id,
          duration,
        },
      );

      return newTeam.id;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[${teamCreationId}] Team creation failed after ${duration}ms:`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          params: {
            userId: params.userId,
            teamName: params.name,
            baseCurrency: params.baseCurrency,
            countryCode: params.countryCode,
          },
          duration,
        },
      );

      // Re-throw with more specific error messages
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to create team due to an unexpected error.");
    }
  });

  return teamId;
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
  // First verify the user is actually a member of this team
  const hasAccess = await hasTeamAccess(db, params.teamId, params.userId);
  if (!hasAccess) {
    throw new Error("User is not a member of this team");
  }

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

type DeleteTeamParams = {
  teamId: string;
  userId: string;
};

export async function deleteTeam(db: Database, params: DeleteTeamParams) {
  // First verify the user is actually a member of this team
  const hasAccess = await hasTeamAccess(db, params.teamId, params.userId);
  if (!hasAccess) {
    throw new Error("User is not a member of this team");
  }

  // Get all team members BEFORE deleting (needed for cache invalidation)
  const teamMembers = await db
    .select({ userId: usersOnTeam.userId })
    .from(usersOnTeam)
    .where(eq(usersOnTeam.teamId, params.teamId));

  const [result] = await db
    .delete(teams)
    .where(eq(teams.id, params.teamId))
    .returning({
      id: teams.id,
    });

  if (!result) {
    return null;
  }

  return {
    ...result,
    memberUserIds: teamMembers
      .map((m) => m.userId)
      .filter((id): id is string => id !== null),
  };
}

type DeleteTeamMemberParams = {
  userId: string;
  teamId: string;
};

export async function deleteTeamMember(
  db: Database,
  params: DeleteTeamMemberParams,
) {
  // First verify the user is actually a member of this team
  const hasAccess = await hasTeamAccess(db, params.teamId, params.userId);
  if (!hasAccess) {
    throw new Error("User is not a member of this team");
  }

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

export async function getTeamMemberRole(
  db: Database,
  teamId: string,
  userId: string,
): Promise<"owner" | "member" | null> {
  const result = await db
    .select({ role: usersOnTeam.role })
    .from(usersOnTeam)
    .where(and(eq(usersOnTeam.teamId, teamId), eq(usersOnTeam.userId, userId)))
    .limit(1);

  return result[0]?.role ?? null;
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

  // First verify the user is actually a member of this team
  const hasAccess = await hasTeamAccess(db, teamId, userId);
  if (!hasAccess) {
    throw new Error("User is not a member of this team");
  }

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

/**
 * Owner info returned from getTeamOwnerInfo
 */
export type TeamOwnerInfo = {
  timezone: string;
  locale: string;
};

/**
 * Get the team owner's timezone and locale.
 * Owner is defined as the first user to join the team (earliest usersOnTeam.createdAt).
 * Falls back to UTC and "en" if not set.
 *
 * @param db - Database instance
 * @param teamId - Team ID to get owner info for
 * @returns Owner's timezone (IANA format) and locale
 */
export async function getTeamOwnerInfo(
  db: Database,
  teamId: string,
): Promise<TeamOwnerInfo> {
  const result = await db
    .select({
      timezone: users.timezone,
      locale: users.locale,
    })
    .from(usersOnTeam)
    .innerJoin(users, eq(usersOnTeam.userId, users.id))
    .where(eq(usersOnTeam.teamId, teamId))
    .orderBy(usersOnTeam.createdAt)
    .limit(1);

  return {
    timezone: result[0]?.timezone || "UTC",
    locale: result[0]?.locale || "en",
  };
}

/**
 * Get the team owner's timezone.
 * Owner is defined as the first user to join the team (earliest usersOnTeam.createdAt).
 * Falls back to UTC if no timezone is set.
 *
 * @param db - Database instance
 * @param teamId - Team ID to get owner timezone for
 * @returns Owner's timezone (IANA format) or "UTC" as fallback
 */
export async function getTeamOwnerTimezone(
  db: Database,
  teamId: string,
): Promise<string> {
  const info = await getTeamOwnerInfo(db, teamId);
  return info.timezone;
}

/**
 * Parameters for getting teams eligible for insights generation
 */
export type GetTeamsForInsightsParams = {
  /** Optional list of specific team IDs to filter by */
  enabledTeamIds?: string[];
  /** Cursor for pagination (team ID to start after) */
  cursor?: string | null;
  /** Number of teams to fetch per batch */
  limit?: number;
  /** Number of days a trial team can be eligible (default: 30) */
  trialEligibilityDays?: number;
  /** Only return teams where it's currently this hour (0-23) in their local time */
  targetLocalHour?: number;
};

/**
 * Result type for teams eligible for insights
 */
export type InsightEligibleTeam = {
  id: string;
  baseCurrency: string | null;
  ownerLocale: string;
};

/**
 * Get teams eligible for insights generation.
 *
 * Eligible teams are:
 * - Paying customers (starter/pro plans)
 * - Active trial users (created within past N days, not canceled)
 * - Must have baseCurrency set (indicates they have financial data)
 * - If targetLocalHour is set, only teams where it's that hour locally
 *
 * Uses cursor-based pagination for efficient batch processing.
 *
 * @param db - Database instance
 * @param params - Query parameters
 * @returns Array of eligible teams with their base currency
 */
export async function getTeamsForInsights(
  db: Database,
  params: GetTeamsForInsightsParams = {},
): Promise<InsightEligibleTeam[]> {
  const {
    enabledTeamIds,
    cursor,
    limit = 100,
    trialEligibilityDays = 30,
    targetLocalHour,
  } = params;

  // Calculate trial eligibility cutoff
  const trialCutoffDate = subDays(
    new Date(),
    trialEligibilityDays,
  ).toISOString();

  // Build plan condition:
  // - Paying: plan is 'starter' or 'pro'
  // - Active trial: plan is 'trial' AND not canceled AND created within eligibility period
  const planCondition = or(
    eq(teams.plan, "starter"),
    eq(teams.plan, "pro"),
    and(
      eq(teams.plan, "trial"),
      isNull(teams.canceledAt),
      gte(teams.createdAt, trialCutoffDate),
    ),
  )!;

  // Build where conditions
  const conditions: (typeof planCondition)[] = [
    // Must have base currency set (indicates they have financial data)
    isNotNull(teams.baseCurrency),
    planCondition,
  ];

  // Filter by enabled team IDs if specified
  if (enabledTeamIds !== undefined) {
    conditions.push(inArray(teams.id, enabledTeamIds));
  }

  // Cursor-based pagination: get teams with ID greater than cursor
  if (cursor) {
    conditions.push(gt(teams.id, cursor));
  }

  const result = await db
    .select({
      id: teams.id,
      baseCurrency: teams.baseCurrency,
    })
    .from(teams)
    .where(and(...conditions))
    .orderBy(teams.id)
    .limit(limit);

  // Enrich results with owner locale (and filter by timezone if needed)
  const now = new Date();
  const enrichedTeams: InsightEligibleTeam[] = [];

  for (const team of result) {
    const ownerInfo = await getTeamOwnerInfo(db, team.id);

    // If targeting a specific hour, filter by timezone
    if (targetLocalHour !== undefined) {
      const localHour = getHourInTimezone(now, ownerInfo.timezone);
      if (localHour !== targetLocalHour) {
        continue;
      }
    }

    enrichedTeams.push({
      id: team.id,
      baseCurrency: team.baseCurrency,
      ownerLocale: ownerInfo.locale,
    });
  }

  return enrichedTeams;
}

/**
 * Get the current hour (0-23) in a given IANA timezone
 */
function getHourInTimezone(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hourPart = parts.find((p) => p.type === "hour");
    return hourPart ? Number.parseInt(hourPart.value, 10) : date.getUTCHours();
  } catch {
    // Invalid timezone, fall back to UTC
    return date.getUTCHours();
  }
}
