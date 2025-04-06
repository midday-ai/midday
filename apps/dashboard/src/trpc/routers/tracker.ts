import { getTrackerRecordsByRangeQuery } from "@midday/supabase/queries";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const trackerRouter = createTRPCRouter({
  get: protectedProcedure.query(async () => {
    return [];
  }),

  recordsByRange: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        projectId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, session, teamId } }) => {
      return getTrackerRecordsByRangeQuery(supabase, {
        teamId: teamId!,
        userId: session.user.id,
        ...input,
      });
    }),
});
