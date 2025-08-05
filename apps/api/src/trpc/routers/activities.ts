import {
  getActivitiesSchema,
  updateActivityStatusSchema,
  updateAllActivitiesStatusSchema,
} from "@api/schemas/activities";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getActivities,
  updateActivityStatus,
  updateAllActivitiesStatus,
} from "@midday/db/queries";

export const activitiesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(getActivitiesSchema.optional())
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getActivities(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  updateStatus: protectedProcedure
    .input(updateActivityStatusSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return updateActivityStatus(db, input.activityId, input.status);
    }),

  updateAllStatus: protectedProcedure
    .input(updateAllActivitiesStatusSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateAllActivitiesStatus(db, teamId!, input.status, {
        userId: input.userId,
      });
    }),
});
