import { getUserSettingsNotificationTypes } from "@midday/notifications";
import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { notificationSettings } from "../schema";

export type NotificationChannel = "in_app" | "email" | "push";

export interface NotificationSetting {
  id: string;
  userId: string;
  teamId: string;
  notificationType: string;
  channel: NotificationChannel;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertNotificationSettingParams {
  userId: string;
  teamId: string;
  notificationType: string;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface GetNotificationSettingsParams {
  userId: string;
  teamId: string;
  notificationType?: string;
  channel?: NotificationChannel;
}

export async function getNotificationSettings(
  db: Database,
  params: GetNotificationSettingsParams,
): Promise<NotificationSetting[]> {
  const conditions = [
    eq(notificationSettings.userId, params.userId),
    eq(notificationSettings.teamId, params.teamId),
  ];

  if (params.notificationType) {
    conditions.push(
      eq(notificationSettings.notificationType, params.notificationType),
    );
  }

  if (params.channel) {
    conditions.push(eq(notificationSettings.channel, params.channel));
  }

  const results = await db
    .select()
    .from(notificationSettings)
    .where(and(...conditions));

  return results.map((result) => ({
    ...result,
    channel: result.channel as NotificationChannel,
  }));
}

export async function upsertNotificationSetting(
  db: Database,
  params: UpsertNotificationSettingParams,
): Promise<NotificationSetting> {
  const [result] = await db
    .insert(notificationSettings)
    .values({
      userId: params.userId,
      teamId: params.teamId,
      notificationType: params.notificationType,
      channel: params.channel,
      enabled: params.enabled,
    })
    .onConflictDoUpdate({
      target: [
        notificationSettings.userId,
        notificationSettings.teamId,
        notificationSettings.notificationType,
        notificationSettings.channel,
      ],
      set: {
        enabled: params.enabled,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  if (!result) {
    throw new Error("Failed to upsert notification setting");
  }

  return {
    ...result,
    channel: result.channel as NotificationChannel,
  };
}

// Helper to check if a specific notification should be sent
export async function shouldSendNotification(
  db: Database,
  userId: string,
  teamId: string,
  notificationType: string,
  channel: NotificationChannel,
): Promise<boolean> {
  const settings = await getNotificationSettings(db, {
    userId,
    teamId,
    notificationType,
    channel,
  });

  // If no setting exists, default to enabled
  if (settings.length === 0) {
    return true;
  }

  return settings[0]?.enabled ?? true;
}

// Get all notification types with their current settings for a user
// Note: This only returns the backend data (type, channels, settings)
// Frontend should handle name/description via i18n
export async function getUserNotificationPreferences(
  db: Database,
  userId: string,
  teamId: string,
): Promise<
  {
    type: string;
    channels: NotificationChannel[];
    settings: { channel: NotificationChannel; enabled: boolean }[];
    category?: string;
    order?: number;
  }[]
> {
  const userSettings = await getNotificationSettings(db, { userId, teamId });

  // Get notification types that should appear in user settings
  const notificationTypes = getUserSettingsNotificationTypes();

  return notificationTypes.map((notificationType) => ({
    type: notificationType.type,
    channels: notificationType.channels,
    category: notificationType.category,
    order: notificationType.order,
    settings: notificationType.channels.map((channel) => {
      const setting = userSettings.find(
        (s) =>
          s.notificationType === notificationType.type && s.channel === channel,
      );
      return {
        channel,
        enabled: setting?.enabled ?? true, // Default to enabled if no setting exists
      };
    }),
  }));
}

// Bulk update multiple notification settings
export async function bulkUpdateNotificationSettings(
  db: Database,
  userId: string,
  teamId: string,
  updates: {
    notificationType: string;
    channel: NotificationChannel;
    enabled: boolean;
  }[],
): Promise<NotificationSetting[]> {
  const results = await Promise.all(
    updates.map((update) =>
      upsertNotificationSetting(db, {
        userId,
        teamId,
        ...update,
      }),
    ),
  );

  return results;
}
