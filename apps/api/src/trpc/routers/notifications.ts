import {
  getNotificationsSchema,
  updateAllNotificationsStatusSchema,
  updateNotificationStatusSchema,
} from "@api/schemas/notifications";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getActivities,
  updateActivityStatus,
  updateAllActivitiesStatus,
} from "@midday/db/queries";

export const notificationsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(getNotificationsSchema.optional())
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getActivities(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  updateStatus: protectedProcedure
    .input(updateNotificationStatusSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return updateActivityStatus(db, input.activityId, input.status);
    }),

  updateAllStatus: protectedProcedure
    .input(updateAllNotificationsStatusSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateAllActivitiesStatus(db, teamId!, input.status, {
        userId: input.userId,
      });
    }),
});
