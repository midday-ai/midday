import { connectDb } from "@api/db";
import { createClient } from "@api/services/supabase";
import { verifyAccessToken } from "@api/utils/auth";
import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "hono";
import superjson from "superjson";

export const createTRPCContext = async (_: unknown, c: Context) => {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const teamId = c.req.header("X-Team-Id");
  const session = await verifyAccessToken(accessToken);
  const supabase = await createClient(accessToken);

  return {
    session,
    teamId,
    supabase,
    db: await connectDb(),
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const protectedProcedure = t.procedure.use(async (opts) => {
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
