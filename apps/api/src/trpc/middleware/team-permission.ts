import type { Session } from "@api/utils/auth";
import type { TeamRole } from "@api/utils/role-permissions";
import { withRetryOnPrimary } from "@api/utils/db-retry";
import { teamCache } from "@midday/cache/team-cache";
import type { Database } from "@midday/db/client";
import { TRPCError } from "@trpc/server";

export const withTeamPermission = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    db: Database;
  };
  next: (opts: {
    ctx: {
      session?: Session | null;
      db: Database;
      teamId: string | null;
      role: TeamRole | null;
      entityId: string | null;
      entityType: string | null;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  const userId = ctx.session?.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No permission to access this team",
    });
  }

  // Try replica first (fast path), fallback to primary on failure
  // This preserves the benefit of fast replicas while handling replication lag gracefully
  // retryOnNull: true ensures we check primary if replica returns null (replication lag)
  const result = await withRetryOnPrimary(
    ctx.db,
    async (db) => {
      return await db.query.users.findFirst({
        with: {
          usersOnTeams: {
            columns: {
              id: true,
              teamId: true,
              role: true,
              entityId: true,
              entityType: true,
            },
          },
        },
        where: (users, { eq }) => eq(users.id, userId),
      });
    },
    { retryOnNull: true },
  );

  if (!result) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  const teamId = result.teamId;
  let role: TeamRole | null = null;
  let entityId: string | null = null;
  let entityType: string | null = null;

  // If teamId is null, user has no team assigned but this is now allowed
  if (teamId !== null) {
    const cacheKey = `user:${userId}:team:${teamId}`;
    let hasAccess = await teamCache.get(cacheKey);

    const membership = result.usersOnTeams.find((m) => m.teamId === teamId);

    if (hasAccess === undefined) {
      hasAccess = !!membership;
      await teamCache.set(cacheKey, hasAccess);
    }

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No permission to access this team",
      });
    }

    if (membership) {
      role = (membership.role as TeamRole) ?? null;
      entityId = membership.entityId ?? null;
      entityType = membership.entityType ?? null;
    }
  }

  return next({
    ctx: {
      session: ctx.session,
      teamId,
      role,
      entityId,
      entityType,
      db: ctx.db,
    },
  });
};
