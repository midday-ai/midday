import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getTeamMembersQuery } from "@midday/supabase/queries";

export const teamRouter = createTRPCRouter({
  members: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getTeamMembersQuery(supabase, teamId);

    return data;
  }),
});
