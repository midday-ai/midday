import { createClient } from "@api/services/supabase";
import type { Session } from "@api/utils/auth";
import { verifyAccessToken } from "@api/utils/auth";
import { getGeoContext } from "@api/utils/geo";
import { safeCompare } from "@api/utils/safe-compare";
import type { Database } from "@midday/db/client";
import { db } from "@midday/db/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "hono";
import superjson from "superjson";
import { withPrimaryReadAfterWrite } from "./middleware/primary-read-after-write";
import { withTeamPermission } from "./middleware/team-permission";

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
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const internalKey = c.req.header("x-internal-key");

  // Check for internal service-to-service authentication (constant-time comparison)
  const isInternalRequest =
    !!internalKey &&
    !!process.env.INTERNAL_API_KEY &&
    safeCompare(internalKey, process.env.INTERNAL_API_KEY);

  const session = await verifyAccessToken(accessToken);
  const supabase = await createClient(accessToken);

  // Use the singleton database instance - no need for caching
  const geo = getGeoContext(c.req);

  // Check if client wants to force primary database reads (for replication lag handling)
  const forcePrimary = c.req.header("x-force-primary") === "true";

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

export const publicProcedure = t.procedure.use(withPrimaryDbMiddleware);

export const protectedProcedure = t.procedure
  .use(withTeamPermissionMiddleware) // NOTE: This is needed to ensure that the teamId is set in the context
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
  .use(withPrimaryDbMiddleware)
  .use(async (opts) => {
    const { isInternalRequest, session } = opts.ctx;

    // Allow internal service-to-service calls
    if (isInternalRequest) {
      return opts.next({ ctx: opts.ctx });
    }

    // Otherwise require a valid user session
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
