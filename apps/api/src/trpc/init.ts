import { createClient } from "@api/services/supabase";
import { verifyAccessToken } from "@api/utils/auth";
import type { Session } from "@api/utils/auth";
import { getGeoContext } from "@api/utils/geo";
import {
  type TeamRole,
  isInternalRole,
} from "@api/utils/role-permissions";
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
  role?: TeamRole | null;
  entityId?: string | null;
  entityType?: string | null;
  forcePrimary?: boolean;
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

  // Check if client wants to force primary database reads (for replication lag handling)
  const forcePrimary = c.req.header("x-force-primary") === "true";

  return {
    session,
    supabase,
    db,
    geo,
    forcePrimary,
  };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    console.error("[TRPC Error]", {
      code: shape.code,
      message: shape.message,
      path: shape.data?.path,
      cause: error.cause instanceof Error ? error.cause.message : undefined,
      stack: error.stack,
    });
    return shape;
  },
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
    const { teamId, session, role, entityId, entityType } = opts.ctx;

    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
      ctx: {
        teamId,
        session,
        role,
        entityId,
        entityType,
      },
    });
  });

/** Internal roles only (owner, admin, member). Excludes external portal users. */
export const internalProcedure = protectedProcedure.use(async (opts) => {
  const { role } = opts.ctx;
  if (!role || !isInternalRole(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Internal team access required",
    });
  }
  return opts.next({ ctx: opts.ctx });
});

/** Write access for internal roles (owner, admin, member). */
export const memberProcedure = internalProcedure;

/** Admin operations (owner or admin only). */
export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { role } = opts.ctx;
  if (role !== "owner" && role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return opts.next({ ctx: opts.ctx });
});

/** Owner-only operations (billing, team deletion). */
export const ownerProcedure = protectedProcedure.use(async (opts) => {
  const { role } = opts.ctx;
  if (role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Owner access required",
    });
  }
  return opts.next({ ctx: opts.ctx });
});
