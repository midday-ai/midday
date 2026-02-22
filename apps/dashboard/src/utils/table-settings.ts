import type {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  VisibilityState,
} from "@tanstack/react-table";

/**
 * Table identifiers for all supported tables
 */
export type TableId = "transactions" | "customers" | "invoices" | "vault";

/**
 * Settings for a single table
 */
export interface TableSettings {
  columns: VisibilityState;
  sizing: ColumnSizingState;
  order: ColumnOrderState;
}

/**
 * Settings for all tables stored in a single cookie
 */
export type AllTableSettings = {
  [K in TableId]?: Partial<TableSettings>;
};

/**
 * Cookie key for unified table settings
 */
export const TABLE_SETTINGS_COOKIE = "table-settings";

/**
 * Default hidden columns for each table
 */
export const defaultHiddenColumns: Record<TableId, string[]> = {
  transactions: [
    "assigned",
    "tags",
    "method",
    "counterparty",
    "taxAmount",
    "baseAmount",
  ],
  customers: ["tags", "website", "financeEmail", "language"],
  invoices: [
    "sentAt",
    "exclVat",
    "exclTax",
    "vatAmount",
    "taxAmount",
    "vatRate",
    "taxRate",
    "internalNote",
  ],
  vault: [], // No hidden columns by default
};

/**
 * Get default column visibility for a table
 */
export function getDefaultColumnVisibility(tableId: TableId): VisibilityState {
  const columnsToHide = defaultHiddenColumns[tableId];
  return columnsToHide.reduce(
    (acc, col) => {
      acc[col] = false;
      return acc;
    },
    {} as Record<string, boolean>,
  );
}

/**
 * Get default settings for a table
 */
export function getDefaultTableSettings(tableId: TableId): TableSettings {
  return {
    columns: getDefaultColumnVisibility(tableId),
    sizing: {},
    order: [],
  };
}

/**
 * Merge saved settings with defaults, ensuring all required fields exist
 */
export function mergeWithDefaults(
  saved: Partial<TableSettings> | undefined,
  tableId: TableId,
): TableSettings {
  const defaults = getDefaultTableSettings(tableId);
  return {
    columns: saved?.columns ?? defaults.columns,
    sizing: saved?.sizing ?? defaults.sizing,
    order: saved?.order ?? defaults.order,
  };
}

/**
 * Extract column IDs from column definitions in definition order.
 */
export function getColumnIds<TData>(columns: ColumnDef<TData>[]): string[] {
  return columns
    .map(
      (col) =>
        col.id ??
        (col as ColumnDef<TData> & { accessorKey?: string }).accessorKey ??
        "",
    )
    .filter(Boolean);
}

/**
 * Normalize a saved column order against the current column definitions.
 * - Removes columns that no longer exist in definitions
 * - Inserts new columns (not in saved order) before "actions"
 * - Ensures "actions" is always the last column
 */
export function normalizeColumnOrder(
  savedOrder: ColumnOrderState,
  allColumnIds: string[],
): ColumnOrderState {
  if (savedOrder.length === 0) return savedOrder;

  const definedIds = new Set(allColumnIds);
  const savedIds = new Set(savedOrder);

  const orderWithoutActions = savedOrder.filter(
    (id) => id !== "actions" && definedIds.has(id),
  );

  const newColumns = allColumnIds.filter(
    (id) => id !== "actions" && !savedIds.has(id),
  );

  const result = [...orderWithoutActions, ...newColumns];

  if (definedIds.has("actions")) {
    result.push("actions");
  }

  return result;
}
