import type { CSSProperties } from "react";

interface GetCellStyleOptions {
  /** The column ID */
  columnId: string;
  /** Index of this cell in the row */
  cellIndex: number;
  /** Total number of cells in the row */
  totalCells: number;
  /** ID of the last cell (to check if it's actions) */
  lastCellId: string;
  /** Function to get sticky styles for a column */
  getStickyStyle: (id: string) => CSSProperties;
  /** Whether this column is sticky */
  isSticky: boolean;
  /** Current column size */
  columnSize: number;
  /** Minimum column size */
  minSize?: number;
}

/**
 * Get consistent cell styles for table cells
 * Handles sticky columns, actions column, and flex fill for last column before actions
 */
export function getCellStyle({
  columnId,
  cellIndex,
  totalCells,
  lastCellId,
  getStickyStyle,
  isSticky,
  columnSize,
  minSize,
}: GetCellStyleOptions): CSSProperties {
  const isActions = columnId === "actions";
  const isLastBeforeActions =
    cellIndex === totalCells - 2 && lastCellId === "actions";

  return {
    width: columnSize,
    minWidth: isSticky ? columnSize : minSize,
    maxWidth: isSticky ? columnSize : undefined,
    ...getStickyStyle(columnId),
    // Border right for all cells except actions and the last cell before actions
    ...(columnId !== "actions" &&
      !isLastBeforeActions && {
        borderRight: "1px solid hsl(var(--border))",
      }),
    // Flex fill for last non-sticky column before actions
    ...(isLastBeforeActions && !isSticky && { flex: 1 }),
    // Special styling for actions column
    ...(isActions && {
      borderLeft: "1px solid hsl(var(--border))",
      borderBottom: "1px solid hsl(var(--border))",
      borderRight: "none",
      zIndex: 50,
      justifyContent: "center",
    }),
  };
}

interface GetHeaderStyleOptions {
  /** The column ID */
  columnId: string;
  /** Index of this header in the row */
  headerIndex: number;
  /** Total number of headers in the row */
  totalHeaders: number;
  /** ID of the last header (to check if it's actions) */
  lastHeaderId: string;
  /** Function to get sticky styles for a column */
  getStickyStyle: (id: string) => CSSProperties;
  /** Whether this column is sticky */
  isSticky: boolean;
  /** Current header size */
  headerSize: number;
  /** Minimum header size */
  minSize?: number;
}

/**
 * Get consistent header styles for table headers
 * Similar to getCellStyle but with header-specific adjustments
 */
export function getHeaderStyle({
  columnId,
  headerIndex,
  totalHeaders,
  lastHeaderId,
  getStickyStyle,
  isSticky,
  headerSize,
  minSize,
}: GetHeaderStyleOptions): CSSProperties {
  const isActions = columnId === "actions";
  const isLastBeforeActions =
    headerIndex === totalHeaders - 2 && lastHeaderId === "actions";

  return {
    width: headerSize,
    minWidth: isSticky ? headerSize : minSize,
    maxWidth: isSticky ? headerSize : undefined,
    ...getStickyStyle(columnId),
    // Border right for all headers except actions and the last header before actions
    ...(columnId !== "actions" &&
      !isLastBeforeActions && {
        borderRight: "1px solid hsl(var(--border))",
      }),
    // Flex fill for last non-sticky column before actions
    ...(isLastBeforeActions && !isSticky && { flex: 1 }),
    // Special styling for actions column header
    ...(isActions && {
      borderLeft: "1px solid hsl(var(--border))",
      borderTop: "1px solid hsl(var(--border))",
    }),
  };
}
