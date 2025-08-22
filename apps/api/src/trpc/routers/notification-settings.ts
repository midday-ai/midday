import {
  bulkUpdateNotificationSettingsSchema,
  getNotificationSettingsSchema,
  updateNotificationSettingSchema,
} from "@api/schemas/notification-settings";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  bulkUpdateNotificationSettings,
  getNotificationSettings,
  getUserNotificationPreferences,
  upsertNotificationSetting,
} from "@midday/db/queries";

export const notificationSettingsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getNotificationSettingsSchema.optional())
    .query(async ({ ctx: { db, session, teamId }, input = {} }) => {
      return getNotificationSettings(db, {
        userId: session.user.id,
        teamId: teamId!,
        ...input,
      });
    }),

  // Get all notification types with their current settings for the user
  getAll: protectedProcedure.query(async ({ ctx: { db, session, teamId } }) => {
    return getUserNotificationPreferences(db, session.user.id, teamId!);
  }),

  // Update a single notification setting
  update: protectedProcedure
    .input(updateNotificationSettingSchema)
    .mutation(async ({ ctx: { db, session, teamId }, input }) => {
      return upsertNotificationSetting(db, {
        userId: session.user.id,
        teamId: teamId!,
        ...input,
      });
    }),

  // Bulk update multiple notification settings
  bulkUpdate: protectedProcedure
    .input(bulkUpdateNotificationSettingsSchema)
    .mutation(async ({ ctx: { db, session, teamId }, input }) => {
      return bulkUpdateNotificationSettings(
        db,
        session.user.id,
        teamId!,
        input.updates,
      );
    }),
});
