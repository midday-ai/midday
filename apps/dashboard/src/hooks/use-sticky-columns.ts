import { cn } from "@midday/ui/cn";
import type { VisibilityState } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";

interface TableColumn {
  id: string;
  getIsVisible: () => boolean;
}

interface TableInterface {
  getAllLeafColumns: () => TableColumn[];
}

interface UseStickyColumnsProps {
  columnVisibility?: VisibilityState;
  table?: TableInterface;
  loading?: boolean;
}

export function useStickyColumns({
  columnVisibility,
  table,
  loading,
}: UseStickyColumnsProps) {
  // Memoize isVisible to prevent breaking downstream useMemo dependencies
  const isVisible = useCallback(
    (id: string) =>
      loading ||
      table
        ?.getAllLeafColumns()
        .find((col) => col.id === id)
        ?.getIsVisible() ||
      (columnVisibility && columnVisibility[id] !== false),
    [loading, table, columnVisibility],
  );

  // Calculate dynamic sticky positions for transaction columns
  // Uses inline visibility check to avoid dependency on isVisible callback
  const stickyPositions = useMemo(() => {
    const checkVisible = (id: string) =>
      loading ||
      table
        ?.getAllLeafColumns()
        .find((col) => col.id === id)
        ?.getIsVisible() ||
      (columnVisibility && columnVisibility[id] !== false);

    let position = 0;
    const positions: Record<string, number> = {};

    // Select column (always visible)
    positions.select = position;
    position += 50; // width of select column

    // Date column
    if (checkVisible("date")) {
      positions.date = position;
      position += 110; // width of date column
    }

    // Description column
    if (checkVisible("description")) {
      positions.description = position;
    }

    return positions;
  }, [loading, table, columnVisibility]);

  // Memoize getStickyStyle to return stable function reference
  const getStickyStyle = useCallback(
    (columnId: string) => {
      const position = stickyPositions[columnId];
      return position !== undefined
        ? ({ "--stick-left": `${position}px` } as React.CSSProperties)
        : {};
    },
    [stickyPositions],
  );

  // Memoize getStickyClassName to return stable function reference
  const getStickyClassName = useCallback(
    (columnId: string, baseClassName?: string) => {
      const stickyColumns = ["select", "date", "description"];
      const isSticky = stickyColumns.includes(columnId);
      return cn(
        baseClassName,
        isSticky && "md:sticky md:left-[var(--stick-left)]",
      );
    },
    [],
  );

  return {
    stickyPositions,
    getStickyStyle,
    getStickyClassName,
    isVisible,
  };
}
