import type { ColumnDef } from "@tanstack/react-table";
import type { RefObject } from "react";
import type { TableId } from "@/utils/table-settings";

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
 * Scroll state for horizontal table scrolling
 * Used by table headers to show horizontal pagination
 */
export interface TableScrollState {
  containerRef: RefObject<HTMLDivElement | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  isScrollable: boolean;
  scrollLeft: () => void;
  scrollRight: () => void;
}

/**
 * Sticky column configuration
 */
export interface StickyColumnConfig {
  id: string;
  width: number;
}

/**
 * Configuration for a table type
 */
export interface TableConfig {
  tableId: TableId;
  stickyColumns: StickyColumnConfig[];
  sortFieldMap: Record<string, string>;
  nonReorderableColumns: Set<string>;
  rowHeight: number;
  summaryGridHeight?: number;
}

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

/**
 * Actions column class when it should be full width (no sticky, no left border)
 */
export const ACTIONS_FULL_WIDTH_HEADER_CLASS =
  "group/header relative h-full px-4 !border-t border-border flex items-center justify-center bg-background z-10";

/**
 * Actions column class when sticky to the right
 */
export const ACTIONS_STICKY_HEADER_CLASS =
  "group/header relative h-full px-4 !border-t !border-l !border-border flex items-center justify-center md:sticky md:right-0 bg-background z-10";

/**
 * Actions cell class when it should be full width
 */
export const ACTIONS_FULL_WIDTH_CELL_CLASS =
  "bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f]";
