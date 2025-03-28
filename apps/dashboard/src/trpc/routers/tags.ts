import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getTagsQuery } from "@midday/supabase/queries";

export const tagsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getTagsQuery(supabase, teamId);

    return data;
  }),
});
