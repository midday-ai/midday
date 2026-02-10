import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { WhatsAppAlreadyConnectedToAnotherTeamError } from "../errors";
import { apps, usersOnTeam } from "../schema";

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
      config: apps.config,
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

export type UpdateAppSettingsBulkParams = {
  appId: string;
  teamId: string;
  settings: Array<{
    id: string;
    value: unknown;
    [key: string]: unknown;
  }>;
};

/**
 * Update all settings for an app at once
 */
export const updateAppSettingsBulk = async (
  db: Database,
  params: UpdateAppSettingsBulkParams,
) => {
  const { appId, teamId, settings } = params;

  // Update the record directly with new settings
  const [result] = await db
    .update(apps)
    .set({ settings })
    .where(and(eq(apps.appId, appId), eq(apps.teamId, teamId)))
    .returning();

  if (!result) {
    throw new Error("Failed to update app settings");
  }

  return result;
};

export type DeleteAppParams = {
  appId: string;
  teamId: string;
};

/**
 * Delete an app (alias for disconnectApp for semantic clarity)
 */
export const deleteApp = async (db: Database, params: DeleteAppParams) => {
  return disconnectApp(db, params);
};

// WhatsApp connection types
export type WhatsAppConnection = {
  phoneNumber: string;
  displayName?: string;
  connectedAt: string;
};

type WhatsAppConfig = {
  connections?: WhatsAppConnection[];
};

/**
 * Find team by WhatsApp phone number
 * Searches all WhatsApp app installations for a matching phone number in connections
 */
export const getAppByWhatsAppNumber = async (
  db: Database,
  phoneNumber: string,
) => {
  const results = await db
    .select()
    .from(apps)
    .where(
      and(
        eq(apps.appId, "whatsapp"),
        sql`${apps.config}->'connections' @> ${JSON.stringify([{ phoneNumber }])}::jsonb`,
      ),
    );

  return results[0] || null;
};

export type AddWhatsAppConnectionParams = {
  teamId: string;
  phoneNumber: string;
  displayName?: string;
};

/**
 * Add a WhatsApp connection to a team
 * Creates the WhatsApp app if it doesn't exist, or adds to existing connections
 */
export const addWhatsAppConnection = async (
  db: Database,
  params: AddWhatsAppConnectionParams,
) => {
  const { teamId, phoneNumber, displayName } = params;

  // Check if this phone number is already connected to any team
  const existingConnection = await getAppByWhatsAppNumber(db, phoneNumber);
  if (existingConnection) {
    // If already connected to this team, just return success
    if (existingConnection.teamId === teamId) {
      return existingConnection;
    }
    // If connected to a different team, throw error
    throw new WhatsAppAlreadyConnectedToAnotherTeamError();
  }

  // Get existing WhatsApp app for this team
  const existingApp = await getAppByAppId(db, { appId: "whatsapp", teamId });

  const newConnection: WhatsAppConnection = {
    phoneNumber,
    displayName,
    connectedAt: new Date().toISOString(),
  };

  if (existingApp) {
    // Add to existing connections
    const config = (existingApp.config as WhatsAppConfig) || {};
    const connections = config.connections || [];

    const [result] = await db
      .update(apps)
      .set({
        config: {
          ...config,
          connections: [...connections, newConnection],
        },
      })
      .where(and(eq(apps.appId, "whatsapp"), eq(apps.teamId, teamId)))
      .returning();

    return result;
  }

  // Get first team member to use as createdBy
  const firstMember = await db
    .select({ userId: usersOnTeam.userId })
    .from(usersOnTeam)
    .where(eq(usersOnTeam.teamId, teamId))
    .limit(1);

  const createdBy = firstMember[0]?.userId || teamId; // Fallback to teamId if no members

  // Create new WhatsApp app with this connection
  const [result] = await db
    .insert(apps)
    .values({
      teamId,
      appId: "whatsapp",
      createdBy,
      config: {
        connections: [newConnection],
      },
      settings: [
        { id: "receipts", label: "Receipt Processing", value: true },
        { id: "matches", label: "Match Notifications", value: true },
      ],
    })
    .returning();

  return result;
};

export type RemoveWhatsAppConnectionParams = {
  teamId: string;
  phoneNumber: string;
};

/**
 * Remove a WhatsApp connection from a team
 */
export const removeWhatsAppConnection = async (
  db: Database,
  params: RemoveWhatsAppConnectionParams,
) => {
  const { teamId, phoneNumber } = params;

  const existingApp = await getAppByAppId(db, { appId: "whatsapp", teamId });

  if (!existingApp) {
    throw new Error("WhatsApp app not found for this team");
  }

  const config = (existingApp.config as WhatsAppConfig) || {};
  const connections = config.connections || [];

  const updatedConnections = connections.filter(
    (c) => c.phoneNumber !== phoneNumber,
  );

  // If no connections left, delete the app entirely
  if (updatedConnections.length === 0) {
    await db
      .delete(apps)
      .where(and(eq(apps.appId, "whatsapp"), eq(apps.teamId, teamId)));
    return null;
  }

  // Update with remaining connections
  const [result] = await db
    .update(apps)
    .set({
      config: {
        ...config,
        connections: updatedConnections,
      },
    })
    .where(and(eq(apps.appId, "whatsapp"), eq(apps.teamId, teamId)))
    .returning();

  return result;
};

/**
 * Get all WhatsApp connections for a team
 */
export const getWhatsAppConnections = async (db: Database, teamId: string) => {
  const app = await getAppByAppId(db, { appId: "whatsapp", teamId });

  if (!app) {
    return [];
  }

  const config = (app.config as WhatsAppConfig) || {};
  return config.connections || [];
};

export type UpdateAppTokensParams = {
  teamId: string;
  appId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

/**
 * Update OAuth tokens for an app (atomic operation)
 * Used for token refresh in accounting integrations (Xero, QuickBooks, etc.)
 * Uses JSONB merge to preserve other config fields
 */
export const updateAppTokens = async (
  db: Database,
  params: UpdateAppTokensParams,
) => {
  const { teamId, appId, accessToken, refreshToken, expiresAt } = params;

  // Use SQL JSONB concatenation for atomic merge
  const [result] = await db
    .update(apps)
    .set({
      config: sql`COALESCE(${apps.config}, '{}'::jsonb) || ${JSON.stringify({
        accessToken,
        refreshToken,
        expiresAt,
      })}::jsonb`,
    })
    .where(and(eq(apps.appId, appId), eq(apps.teamId, teamId)))
    .returning();

  if (!result) {
    throw new Error(`Failed to update tokens for app ${appId}`);
  }

  return result;
};
