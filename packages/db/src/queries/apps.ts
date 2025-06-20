import type { Database } from "@db/client";
import { apps } from "@db/schema";
import { and, eq } from "drizzle-orm";

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
