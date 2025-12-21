import { cookies } from "next/headers";
import { Cookies } from "./constants";
import {
  type AllTableSettings,
  TABLE_SETTINGS_COOKIE,
  type TableId,
  type TableSettings,
  mergeWithDefaults,
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

/**
 * Get initial invoices column visibility from cookie
 * Invoices table uses a simpler pattern (visibility only, no resizing/ordering)
 */
export async function getInitialInvoicesColumnVisibility() {
  const cookieStore = await cookies();

  const columnsToHide = [
    "sentAt",
    "exclVat",
    "exclTax",
    "vatAmount",
    "taxAmount",
    "vatRate",
    "taxRate",
    "internalNote",
  ];

  const savedColumns = cookieStore.get(Cookies.InvoicesColumns)?.value;
  return savedColumns
    ? JSON.parse(savedColumns)
    : columnsToHide.reduce(
        (acc, col) => {
          acc[col] = false;
          return acc;
        },
        {} as Record<string, boolean>,
      );
}
