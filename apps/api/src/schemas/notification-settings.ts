import { z } from "zod";

export const notificationChannelSchema = z.enum(["in_app", "email", "push"]);

export const getNotificationSettingsSchema = z.object({
  notificationType: z.string().optional(),
  channel: notificationChannelSchema.optional(),
});

export const updateNotificationSettingSchema = z.object({
  notificationType: z.string(),
  channel: notificationChannelSchema,
  enabled: z.boolean(),
});

export const bulkUpdateNotificationSettingsSchema = z.object({
  updates: z.array(
    z.object({
      notificationType: z.string(),
      channel: notificationChannelSchema,
      enabled: z.boolean(),
    }),
  ),
});
