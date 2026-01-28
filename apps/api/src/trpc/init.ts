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
import { withPrimaryReadAfterWrite } from "./middleware/primary-read-after-write";
import { withTeamPermission } from "./middleware/team-permission";

type TRPCContext = {
  session: Session | null;
  supabase: SupabaseClient;
  db: Database;
  geo: ReturnType<typeof getGeoContext>;
  teamId?: string;
  forcePrimary?: boolean;
  isServiceCall?: boolean;
};

export const createTRPCContext = async (
  _: unknown,
  c: Context,
): Promise<TRPCContext> => {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const serviceSecret = c.req.header("x-service-secret");
  
  // Check for service-to-service authentication
  const isServiceCall = serviceSecret === process.env.SERVICE_SECRET && !!process.env.SERVICE_SECRET;
  
  // For service calls, we don't need user authentication
  const session = isServiceCall ? null : await verifyAccessToken(accessToken);
  const supabase = await createClient(isServiceCall ? undefined : accessToken);

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
    isServiceCall,
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
 * Service procedure for internal service-to-service calls (jobs, worker, etc.)
 * Authenticates using x-service-secret header instead of user session.
 * Use this for internal API calls that don't have a user context.
 */
export const serviceProcedure = t.procedure
  .use(withPrimaryDbMiddleware)
  .use(async (opts) => {
    const { isServiceCall } = opts.ctx;

    if (!isServiceCall) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Service authentication required",
      });
    }

    return opts.next({
      ctx: {
        isServiceCall: true,
      },
    });
  });
