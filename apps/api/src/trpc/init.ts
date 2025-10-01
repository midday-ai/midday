import { createClient } from "@api/services/supabase";
import { verifyAccessToken } from "@api/utils/auth";
import type { Session } from "@api/utils/auth";
import { getGeoContext } from "@api/utils/geo";
import type { Database } from "@midday/db/client";
import { db } from "@midday/db/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "hono";
import superjson from "superjson";
import { withPlanEligibility } from "./middleware/plan-eligibility";
import { withPrimaryReadAfterWrite } from "./middleware/primary-read-after-write";
import { withTeamPermission } from "./middleware/team-permission";

type TRPCContext = {
  session: Session | null;
  supabase: SupabaseClient;
  db: Database;
  geo: ReturnType<typeof getGeoContext>;
  teamId?: string;
};

export const createTRPCContext = async (
  _: unknown,
  c: Context,
): Promise<TRPCContext> => {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const session = await verifyAccessToken(accessToken);
  const supabase = await createClient(accessToken);

  // Use the singleton database instance - no need for caching
  const geo = getGeoContext(c.req);

  return {
    session,
    supabase,
    db,
    geo,
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

const withPlanEligibilityMiddleware = t.middleware(async (opts) => {
  const { session } = opts.ctx as { session: Session };
  return withPlanEligibility({
    ctx: {
      ...opts.ctx,
      session,
    },
    type: opts.type,
    path: opts.path,
    next: opts.next,
  });
});

export const publicProcedure = t.procedure.use(withPrimaryDbMiddleware);

/**
 * Protected procedure with automatic plan validation for mutations.
 *
 * Behavior:
 * - Queries (read operations): Always allowed, regardless of plan status
 * - Mutations (write operations): Blocked if trial expired or subscription canceled
 *
 * This ensures users can:
 * - View their data even with expired trials
 * - Access billing settings to upgrade
 * - But cannot modify data without a valid plan
 */
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
  })
  .use(withPlanEligibilityMiddleware); // Automatically validates plan for mutations only (must be after auth check)
