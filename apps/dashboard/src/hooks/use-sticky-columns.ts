import { cn } from "@midday/ui/cn";
import type { VisibilityState } from "@tanstack/react-table";
import { useMemo } from "react";

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
  const isVisible = (id: string) =>
    loading ||
    table
      ?.getAllLeafColumns()
      .find((col) => col.id === id)
      ?.getIsVisible() ||
    (columnVisibility && columnVisibility[id] !== false);

  // Calculate dynamic sticky positions for transaction columns
  const stickyPositions = useMemo(() => {
    let position = 0;
    const positions: Record<string, number> = {};

    // Select column (always visible)
    positions.select = position;
    position += 50; // width of select column

    // Date column
    if (isVisible("date")) {
      positions.date = position;
      position += 110; // width of date column
    }

    // Description column
    if (isVisible("description")) {
      positions.description = position;
    }

    return positions;
  }, [isVisible]);

  // Function to get CSS custom properties for sticky columns
  const getStickyStyle = (columnId: string) => {
    const position = stickyPositions[columnId];
    return position !== undefined
      ? ({ "--stick-left": `${position}px` } as React.CSSProperties)
      : {};
  };

  // Function to get sticky class names
  const getStickyClassName = (columnId: string, baseClassName?: string) => {
    const stickyColumns = ["select", "date", "description"];
    const isSticky = stickyColumns.includes(columnId);
    return cn(baseClassName, isSticky && "sticky left-[var(--stick-left)]");
  };

  return {
    stickyPositions,
    getStickyStyle,
    getStickyClassName,
    isVisible,
  };
}
