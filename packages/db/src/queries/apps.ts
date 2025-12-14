import type { Database } from "@db/client";
import { apps } from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export type CreateAppParams = {
  teamId: string;
  createdBy: string;
  appId: string;
  settings?: unknown;
  config?: unknown;
};

export const createApp = async (db: Database, params: CreateAppParams) => {
  const [result] = await db
    .insert(apps)
    .values({
      teamId: params.teamId,
      createdBy: params.createdBy,
      appId: params.appId,
      settings: params.settings,
      config: params.config,
    })
    .onConflictDoUpdate({
      target: [apps.teamId, apps.appId],
      set: {
        config: params.config,
        settings: params.settings,
      },
    })
    .returning();

  return result;
};

type AppSetting = {
  id: string;
  value: string | number | boolean;
  [key: string]: unknown;
};

export const getApps = async (db: Database, teamId: string) => {
  const result = await db
    .select({
      app_id: apps.appId,
      settings: apps.settings,
    })
    .from(apps)
    .where(eq(apps.teamId, teamId));

  return result;
};

export type GetAppByAppIdParams = {
  appId: string;
  teamId: string;
};

export const getAppByAppId = async (
  db: Database,
  params: GetAppByAppIdParams,
) => {
  const [result] = await db
    .select()
    .from(apps)
    .where(and(eq(apps.appId, params.appId), eq(apps.teamId, params.teamId)))
    .limit(1);

  return result || null;
};

export type GetAppBySlackTeamIdParams = {
  slackTeamId: string;
  channelId?: string; // Optional channel ID to help disambiguate if same Slack workspace connected to multiple Midday teams
};

export const getAppBySlackTeamId = async (
  db: Database,
  params: GetAppBySlackTeamIdParams,
) => {
  const { slackTeamId, channelId } = params;

  // Base conditions for Slack app with matching team_id
  const baseConditions = [
    eq(apps.appId, "slack"),
    sql`${apps.config}->>'team_id' = ${slackTeamId}`,
  ];

  // When channelId is provided, look for exact match only (no fallback)
  if (channelId) {
    const results = await db
      .select()
      .from(apps)
      .where(
        and(
          ...baseConditions,
          sql`${apps.config}->>'channel_id' = ${channelId}`,
        ),
      )
      .limit(1);

    const result = results[0] || null;

    if (!result) {
      // Log for debugging - but do NOT fall back to prevent cross-tenant issues
      console.info(
        `No Slack integration found for team_id=${slackTeamId} with channel_id=${channelId}`,
      );
    }

    return result;
  }

  // When channelId is NOT provided, we must ensure there's no ambiguity
  // Query all integrations for this Slack workspace
  const allResults = await db
    .select()
    .from(apps)
    .where(and(...baseConditions))
    .orderBy(desc(apps.createdAt));

  // SECURITY: If multiple integrations exist, we cannot safely determine which one
  // to use without a channelId. Return null to fail safely.
  if (allResults.length > 1) {
    console.error(
      "SECURITY: Multiple Slack integrations found for Slack team. Cannot determine correct Midday team without channel_id. Returning null to prevent cross-tenant issues.",
      {
        slackTeamId,
        count: allResults.length,
        middayTeamIds: allResults.map((r) => r.teamId),
        channelIds: allResults.map(
          (r) =>
            // @ts-expect-error - config is JSONB
            r.config?.channel_id,
        ),
      },
    );
    return null;
  }

  // Only one integration exists - safe to return
  return allResults[0] || null;
};

export type DisconnectAppParams = {
  appId: string;
  teamId: string;
};

export const disconnectApp = async (
  db: Database,
  params: DisconnectAppParams,
) => {
  const { appId, teamId } = params;

  const deleted = await db
    .delete(apps)
    .where(and(eq(apps.appId, appId), eq(apps.teamId, teamId)))
    .returning();

  return deleted[0] || null;
};

export type UpdateAppSettingsParams = {
  appId: string;
  teamId: string;
  option: {
    id: string;
    value: string | number | boolean;
  };
};

export const updateAppSettings = async (
  db: Database,
  params: UpdateAppSettingsParams,
) => {
  const { appId, teamId, option } = params;

  // First fetch the existing app
  const existingApps = await db
    .select({ settings: apps.settings })
    .from(apps)
    .where(and(eq(apps.appId, appId), eq(apps.teamId, teamId)));

  if (!existingApps.length) {
    throw new Error("App not found");
  }

  const existingApp = existingApps[0]!;

  const settings = (existingApp.settings as AppSetting[]) || [];

  // Update the settings
  const updatedSettings = settings.map((setting: AppSetting) => {
    if (setting.id === option.id) {
      return { ...setting, value: option.value };
    }
    return setting;
  });

  // Update the record
  const [result] = await db
    .update(apps)
    .set({ settings: updatedSettings })
    .where(and(eq(apps.appId, appId), eq(apps.teamId, teamId)))
    .returning();

  if (!result) {
    throw new Error("Failed to update app settings");
  }

  return result;
};
