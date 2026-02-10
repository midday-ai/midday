import { cookies } from "next/headers";
import {
  type AllTableSettings,
  mergeWithDefaults,
  TABLE_SETTINGS_COOKIE,
  type TableId,
  type TableSettings,
} from "./table-settings";

/**
 * Get initial table settings from the unified cookie
 * Falls back to defaults if cookie doesn't exist or is invalid
 */
export async function getInitialTableSettings(
  tableId: TableId,
): Promise<TableSettings> {
  const cookieStore = await cookies();
  const saved = cookieStore.get(TABLE_SETTINGS_COOKIE)?.value;

  if (!saved) {
    return mergeWithDefaults(undefined, tableId);
  }

  try {
    const allSettings: AllTableSettings = JSON.parse(saved);
    return mergeWithDefaults(allSettings[tableId], tableId);
  } catch {
    // Invalid JSON, return defaults
    return mergeWithDefaults(undefined, tableId);
  }
}
