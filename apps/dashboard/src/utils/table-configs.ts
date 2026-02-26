import type { StickyColumnConfig, TableConfig } from "@/components/tables/core";
import type { TableId } from "./table-settings";

/**
 * Sticky column configurations for each table
 */
export const STICKY_COLUMNS: Record<TableId, StickyColumnConfig[]> = {
  transactions: [
    { id: "select", width: 50 },
    { id: "date", width: 110 },
    { id: "description", width: 320 },
  ],
  deals: [
    { id: "select", width: 50 },
    { id: "dealNumber", width: 180 },
  ],
  merchants: [{ id: "name", width: 280 }],
  collections: [{ id: "merchant", width: 240 }],
  vault: [
    { id: "select", width: 50 },
    { id: "title", width: 250 },
  ],
};

/**
 * Sort field mappings for each table
 * Maps column IDs to their backend sort field names
 */
export const SORT_FIELD_MAPS: Record<TableId, Record<string, string>> = {
  transactions: {
    date: "date",
    description: "name",
    amount: "amount",
    category: "category",
    counterparty: "counterparty",
    tags: "tags",
    bank_account: "bank_account",
    method: "method",
    assigned: "assigned",
    status: "attachment",
  },
  deals: {
    dealNumber: "deal_number",
    status: "status",
    dueDate: "due_date",
    merchant: "merchant",
    amount: "amount",
    issueDate: "issue_date",
  },
  merchants: {
    name: "name",
    contact: "contact",
    email: "email",
    deals: "deals",
    totalFunded: "total_funded",
    payback: "total_payback",
    balance: "balance",
    totalNsf: "total_nsf",
    tags: "tags",
  },
  vault: {}, // Vault doesn't have sorting
  collections: {
    merchant: "merchant_name",
    balance: "current_balance",
    stage: "stage_position",
    priority: "priority",
    nextFollowUp: "next_follow_up",
    daysInStage: "days_in_stage",
  },
};

/**
 * Non-reorderable columns for each table (sticky + actions)
 */
export const NON_REORDERABLE_COLUMNS: Record<TableId, Set<string>> = {
  transactions: new Set(["select", "date", "description", "actions"]),
  deals: new Set(["select", "dealNumber", "actions"]),
  merchants: new Set(["name", "actions"]),
  collections: new Set(["merchant", "actions"]),
  vault: new Set(["select", "title", "actions"]),
};

/**
 * Row heights for each table
 */
export const ROW_HEIGHTS: Record<TableId, number> = {
  transactions: 45,
  deals: 57,
  merchants: 45,
  collections: 45,
  vault: 45,
};

/**
 * Summary grid heights for tables with summary sections
 */
export const SUMMARY_GRID_HEIGHTS: Partial<Record<TableId, number>> = {
  deals: 180,
  merchants: 180,
  collections: 120,
};

/**
 * Complete table configurations
 */
export const TABLE_CONFIGS: Record<TableId, TableConfig> = {
  transactions: {
    tableId: "transactions",
    stickyColumns: STICKY_COLUMNS.transactions,
    sortFieldMap: SORT_FIELD_MAPS.transactions,
    nonReorderableColumns: NON_REORDERABLE_COLUMNS.transactions,
    rowHeight: ROW_HEIGHTS.transactions,
  },
  deals: {
    tableId: "deals",
    stickyColumns: STICKY_COLUMNS.deals,
    sortFieldMap: SORT_FIELD_MAPS.deals,
    nonReorderableColumns: NON_REORDERABLE_COLUMNS.deals,
    rowHeight: ROW_HEIGHTS.deals,
    summaryGridHeight: SUMMARY_GRID_HEIGHTS.deals,
  },
  merchants: {
    tableId: "merchants",
    stickyColumns: STICKY_COLUMNS.merchants,
    sortFieldMap: SORT_FIELD_MAPS.merchants,
    nonReorderableColumns: NON_REORDERABLE_COLUMNS.merchants,
    rowHeight: ROW_HEIGHTS.merchants,
    summaryGridHeight: SUMMARY_GRID_HEIGHTS.merchants,
  },
  collections: {
    tableId: "collections",
    stickyColumns: STICKY_COLUMNS.collections,
    sortFieldMap: SORT_FIELD_MAPS.collections,
    nonReorderableColumns: NON_REORDERABLE_COLUMNS.collections,
    rowHeight: ROW_HEIGHTS.collections,
    summaryGridHeight: SUMMARY_GRID_HEIGHTS.collections,
  },
  vault: {
    tableId: "vault",
    stickyColumns: STICKY_COLUMNS.vault,
    sortFieldMap: SORT_FIELD_MAPS.vault,
    nonReorderableColumns: NON_REORDERABLE_COLUMNS.vault,
    rowHeight: ROW_HEIGHTS.vault,
  },
};

/**
 * Get table configuration by ID
 */
export function getTableConfig(tableId: TableId): TableConfig {
  return TABLE_CONFIGS[tableId];
}
