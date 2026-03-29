import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { getOverviewSummary } from "@midday/db/queries";

export const overviewRouter = createTRPCRouter({
  summary: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getOverviewSummary(db, { teamId: teamId! });
  }),
});
