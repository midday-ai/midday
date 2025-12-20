import type { ColumnDef } from "@tanstack/react-table";

/**
 * Skeleton types for rendering loading states
 */
export type SkeletonType =
  | "checkbox"
  | "text"
  | "avatar-text"
  | "icon-text"
  | "badge"
  | "tags"
  | "icon";

/**
 * Configuration for skeleton rendering in column meta
 */
export interface SkeletonConfig {
  /** Type of skeleton to render */
  type: SkeletonType;
  /** Optional Tailwind width class (e.g., "w-20", "w-40") */
  width?: string;
}

/**
 * Extended column meta interface with skeleton support
 */
export interface TableColumnMeta {
  className?: string;
  sticky?: boolean;
  sortField?: string;
  skeleton?: SkeletonConfig;
  headerLabel?: string;
}

/**
 * Get column ID from a TanStack Table column definition
 * Works with both `id` and `accessorKey` columns
 */
export function getColumnId<T>(col: ColumnDef<T>): string {
  return col.id || (col as { accessorKey?: string }).accessorKey || "";
}

/**
 * Get header label from column meta or format the column ID
 */
export function getHeaderLabel<T>(col: ColumnDef<T>): string {
  const meta = col.meta as TableColumnMeta | undefined;
  if (meta?.headerLabel) {
    return meta.headerLabel;
  }

  // Format column ID as title case
  const id = getColumnId(col);
  return id
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
