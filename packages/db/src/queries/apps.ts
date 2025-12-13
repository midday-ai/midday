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

  // Build query conditions
  const conditions = [
    eq(apps.appId, "slack"),
    sql`${apps.config}->>'team_id' = ${slackTeamId}`,
  ];

  // If channel ID is provided, use it to find the exact integration
  // Each Slack integration stores a channel_id during OAuth setup
  if (channelId) {
    conditions.push(sql`${apps.config}->>'channel_id' = ${channelId}`);
  }

  // When channelId is not provided, check for multiple results first
  // to warn about potential conflicts
  if (!channelId) {
    const allResults = await db
      .select()
      .from(apps)
      .where(and(...conditions))
      .orderBy(desc(apps.createdAt));

    // Log warning if multiple integrations exist for the same Slack team
    if (allResults.length > 1) {
      console.warn(
        `Multiple Slack integrations found for Slack team ${slackTeamId}. Consider using channel_id to disambiguate.`,
        {
          slackTeamId,
          count: allResults.length,
          teamIds: allResults.map((r) => r.teamId),
          channelIds: allResults.map(
            (r) =>
              // @ts-expect-error - config is JSONB
              r.config?.channel_id,
          ),
        },
      );
    }

    // Return the most recent one
    return allResults[0] || null;
  }

  // When channelId is provided, query with limit since we want exact match
  const results = await db
    .select()
    .from(apps)
    .where(and(...conditions))
    .orderBy(desc(apps.createdAt))
    .limit(1);

  const result = results[0] || null;

  // If no result with channel ID, fall back to just Slack team ID
  // (in case channel_id wasn't stored or channel changed)
  if (!result && channelId) {
    const fallbackResults = await db
      .select()
      .from(apps)
      .where(
        and(
          eq(apps.appId, "slack"),
          sql`${apps.config}->>'team_id' = ${slackTeamId}`,
        ),
      )
      .orderBy(desc(apps.createdAt))
      .limit(1);

    const fallbackResult = fallbackResults[0] || null;

    if (fallbackResult) {
      console.warn(
        `Slack integration found by team_id only (channel_id ${channelId} didn't match). This may indicate the channel was changed or multiple teams share the same Slack workspace.`,
        {
          slackTeamId,
          channelId,
          middayTeamId: fallbackResult.teamId,
        },
      );
      return fallbackResult;
    }
  }

  return result;
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
