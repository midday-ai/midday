import { getTeamId } from "@/utils/team";
import { createClient } from "@midday/supabase/server";
import { TRPCError, initTRPC } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";

// NOTE: All these functions are from cookies and then cached
// In the request lifecycle, they are only called once
export const createTRPCContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const teamId = await getTeamId();

  return {
    session,
    teamId,
    supabase,
  };
});

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
