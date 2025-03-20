import { getSession } from "@midday/supabase/cached-queries";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

export const createTRPCContext = async () => {
  const {
    data: { session },
  } = await getSession();

  return {
    session,
  };
};

export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

export const protectedProcedure = t.procedure.use(async (opts) => {
  const { session } = opts.ctx;

  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      session,
    },
  });
});
