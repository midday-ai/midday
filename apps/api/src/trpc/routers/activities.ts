import {
  getActivitiesSchema,
  markActivityAsReadSchema,
  markAllActivitiesAsReadSchema,
} from "@api/schemas/activities";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getActivities,
  markActivityAsRead,
  markAllActivitiesAsRead,
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

  markAsRead: protectedProcedure
    .input(markActivityAsReadSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return markActivityAsRead(db, input.activityId);
    }),

  markAllAsRead: protectedProcedure
    .input(markAllActivitiesAsReadSchema.optional())
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return markAllActivitiesAsRead(db, teamId!, input);
    }),
});
