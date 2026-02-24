import type { Session } from "@api/utils/auth";
import { withRetryOnPrimary } from "@api/utils/db-retry";
import { teamCache } from "@midday/cache/team-cache";
import type { Database } from "@midday/db/client";
import { createLoggerWithContext } from "@midday/logger";
import { TRPCError } from "@trpc/server";

const DEBUG_PERF = process.env.DEBUG_PERF === "true";
const perfLogger = createLoggerWithContext("perf:trpc");

type TeamResolution = {
  teamId: string | null;
};

const resolveCache = new WeakMap<object, Promise<TeamResolution>>();

async function resolveTeamPermission(
  session: Session | undefined | null,
  db: Database,
): Promise<TeamResolution> {
  const resolveStart = DEBUG_PERF ? performance.now() : 0;
  const userId = session?.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No permission to access this team",
    });
  }

  const dbStart = DEBUG_PERF ? performance.now() : 0;
  const result = await withRetryOnPrimary(
    db,
    async (db) => {
      return await db.query.users.findFirst({
        with: {
          usersOnTeams: {
            columns: {
              id: true,
              teamId: true,
            },
          },
        },
        where: (users, { eq }) => eq(users.id, userId),
      });
    },
    { retryOnNull: true },
  );
  const dbMs = DEBUG_PERF ? performance.now() - dbStart : 0;

  if (!result) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  const teamId = result.teamId;

  let cacheHit: boolean | null = null;
  const cacheStart = DEBUG_PERF ? performance.now() : 0;

  if (teamId !== null) {
    const cacheKey = `user:${userId}:team:${teamId}`;
    let hasAccess = await teamCache.get(cacheKey);

    if (hasAccess === undefined) {
      cacheHit = false;
      hasAccess = result.usersOnTeams.some(
        (membership) => membership.teamId === teamId,
      );

      await teamCache.set(cacheKey, hasAccess);
    } else {
      cacheHit = true;
    }

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No permission to access this team",
      });
    }
  }

  const cacheMs = DEBUG_PERF ? performance.now() - cacheStart : 0;

  if (DEBUG_PERF) {
    perfLogger.info("teamPermission", {
      totalMs: +(performance.now() - resolveStart).toFixed(2),
      dbQueryMs: +dbMs.toFixed(2),
      cacheMs: +cacheMs.toFixed(2),
      cacheHit,
      teamId,
    });
  }

  return { teamId };
}

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
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  let resolution = resolveCache.get(ctx);
  if (!resolution) {
    resolution = resolveTeamPermission(ctx.session, ctx.db);
    resolveCache.set(ctx, resolution);
  }

  const { teamId } = await resolution;

  return next({
    ctx: {
      session: ctx.session,
      teamId,
      db: ctx.db,
    },
  });
};
