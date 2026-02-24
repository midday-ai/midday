import { createClient } from "@api/services/supabase";
import type { Session } from "@api/utils/auth";
import { verifyAccessToken } from "@api/utils/auth";
import { getGeoContext } from "@api/utils/geo";
import { safeCompare } from "@api/utils/safe-compare";
import type { Database } from "@midday/db/client";
import { db } from "@midday/db/client";
import { createLoggerWithContext } from "@midday/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "hono";
import superjson from "superjson";
import { withPrimaryReadAfterWrite } from "./middleware/primary-read-after-write";
import { withTeamPermission } from "./middleware/team-permission";

export const DEBUG_PERF = process.env.DEBUG_PERF === "true";
const perfLogger = createLoggerWithContext("perf:trpc");

type TRPCContext = {
  session: Session | null;
  supabase: SupabaseClient;
  db: Database;
  geo: ReturnType<typeof getGeoContext>;
  teamId?: string;
  forcePrimary?: boolean;
  isInternalRequest?: boolean;
};

export const createTRPCContext = async (
  _: unknown,
  c: Context,
): Promise<TRPCContext> => {
  const ctxStart = DEBUG_PERF ? performance.now() : 0;

  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const internalKey = c.req.header("x-internal-key");

  const isInternalRequest =
    !!internalKey &&
    !!process.env.INTERNAL_API_KEY &&
    safeCompare(internalKey, process.env.INTERNAL_API_KEY);

  const jwtStart = DEBUG_PERF ? performance.now() : 0;
  const session = await verifyAccessToken(accessToken);
  const jwtMs = DEBUG_PERF ? performance.now() - jwtStart : 0;

  const supaStart = DEBUG_PERF ? performance.now() : 0;
  const supabase = await createClient(accessToken);
  const supaMs = DEBUG_PERF ? performance.now() - supaStart : 0;

  const geo = getGeoContext(c.req);
  const forcePrimary = c.req.header("x-force-primary") === "true";

  if (DEBUG_PERF) {
    perfLogger.info("context", {
      totalMs: +(performance.now() - ctxStart).toFixed(2),
      jwtVerifyMs: +jwtMs.toFixed(2),
      supabaseClientMs: +supaMs.toFixed(2),
      hasSession: !!session,
      forcePrimary,
    });
  }

  return {
    session,
    supabase,
    db,
    geo,
    forcePrimary,
    isInternalRequest,
  };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

const withTimingMiddleware = t.middleware(async (opts) => {
  if (!DEBUG_PERF) return opts.next();
  const start = performance.now();
  const result = await opts.next();
  perfLogger.info("procedure", {
    path: opts.path,
    type: opts.type,
    durationMs: +(performance.now() - start).toFixed(2),
  });
  return result;
});

const withPrimaryDbMiddleware = t.middleware(async (opts) => {
  return withPrimaryReadAfterWrite({
    ctx: opts.ctx,
    type: opts.type,
    next: opts.next,
  });
});

const withTeamPermissionMiddleware = t.middleware(async (opts) => {
  return withTeamPermission({
    ctx: opts.ctx,
    next: opts.next,
  });
});

export const publicProcedure = t.procedure
  .use(withTimingMiddleware)
  .use(withPrimaryDbMiddleware);

export const protectedProcedure = t.procedure
  .use(withTimingMiddleware)
  .use(withTeamPermissionMiddleware)
  .use(withPrimaryDbMiddleware)
  .use(async (opts) => {
    const { teamId, session } = opts.ctx;

    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
      ctx: {
        teamId,
        session,
      },
    });
  });

/**
 * Internal procedure for service-to-service calls ONLY.
 * Authenticates exclusively via x-internal-key header (INTERNAL_API_KEY).
 * Used by BullMQ workers, and other internal services.
 * Regular user sessions are NOT accepted — use protectedProcedure for browser-facing endpoints.
 */
export const internalProcedure = t.procedure
  .use(withTimingMiddleware)
  .use(withPrimaryDbMiddleware)
  .use(async (opts) => {
    const { isInternalRequest } = opts.ctx;

    if (!isInternalRequest) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
      ctx: opts.ctx,
    });
  });

/**
 * Procedure that accepts EITHER a valid user session OR a valid internal key.
 * Use for endpoints called from both the dashboard (browser) and internal services
 * (BullMQ workers, etc.).
 */
export const protectedOrInternalProcedure = t.procedure
  .use(withTimingMiddleware)
  .use(withPrimaryDbMiddleware)
  .use(async (opts) => {
    const { isInternalRequest, session } = opts.ctx;

    if (isInternalRequest) {
      return opts.next({ ctx: opts.ctx });
    }

    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
      ctx: {
        ...opts.ctx,
        session,
      },
    });
  });
