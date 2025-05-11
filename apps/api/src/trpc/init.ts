import { createClient } from "@midday/supabase/server";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

export const createTRPCContext = async () => {
  // TODO: Get headers (jwt token + teamId)
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("here", "123");
  // const teamId = await getTeamId();

  return {
    session,
    teamId: "123",
    supabase,
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
