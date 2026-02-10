"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ChartSelection {
  startIndex: number | null;
  endIndex: number | null;
  isSelecting: boolean;
}

export interface UseChartSelectionOptions {
  data: any[];
  dateKey: string;
  enabled?: boolean;
  onSelectionChange?: (
    startDate: string | null,
    endDate: string | null,
  ) => void;
  onSelectionComplete?: (startDate: string, endDate: string) => void;
}

export function useChartSelection({
  data,
  dateKey,
  enabled = true,
  onSelectionChange,
  onSelectionComplete,
}: UseChartSelectionOptions) {
  const [selection, setSelection] = useState<ChartSelection>({
    startIndex: null,
    endIndex: null,
    isSelecting: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  // Convert pixel X coordinate to data index
  const pixelToDataIndex = useCallback(
    (x: number): number | null => {
      if (!containerRef.current || !chartRef.current || data.length === 0) {
        return null;
      }

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const chartWidth = rect.width;
      const chartX = x - rect.left;

      // Get chart margins (approximate, Recharts uses these defaults)
      const marginLeft = 0; // Charts use negative marginLeft
      const marginRight = 6;
      const plotWidth = chartWidth - marginLeft - marginRight;

      // Calculate the X position within the plot area
      const plotX = chartX - marginLeft;

      // Map to data index
      const dataLength = data.length;
      const barWidth = plotWidth / dataLength;
      const index = Math.floor(plotX / barWidth);

      // Clamp to valid range
      if (index < 0) return 0;
      if (index >= dataLength) return dataLength - 1;

      return index;
    },
    [data],
  );

  // Get date from data index
  const getDateFromIndex = useCallback(
    (index: number): string | null => {
      if (index < 0 || index >= data.length) return null;
      const item = data[index];
      const dateValue = item[dateKey];

      // Handle different date formats
      if (typeof dateValue === "string") {
        // Try to parse month names (e.g., "Jan", "Feb")
        const _monthMap: Record<string, string> = {
          Jan: "01",
          Feb: "02",
          Mar: "03",
          Apr: "04",
          May: "05",
          Jun: "06",
          Jul: "07",
          Aug: "08",
          Sep: "09",
          Oct: "10",
          Nov: "11",
          Dec: "12",
        };

        // If it's a month abbreviation, we need to construct a full date
        // For now, return the month string as-is
        return dateValue;
      }

      if (dateValue instanceof Date) {
        return dateValue.toISOString();
      }

      return String(dateValue);
    },
    [data, dateKey],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;

      // Stop propagation to prevent parent long press handlers from triggering
      e.stopPropagation();

      const index = pixelToDataIndex(e.clientX);
      if (index === null) return;

      setSelection({
        startIndex: index,
        endIndex: index,
        isSelecting: true,
      });

      const startDate = getDateFromIndex(index);
      const endDate = getDateFromIndex(index);
      onSelectionChange?.(startDate, endDate);
    },
    [enabled, pixelToDataIndex, getDateFromIndex, onSelectionChange],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !selection.isSelecting) return;

      // Stop propagation to prevent parent handlers from interfering
      e.stopPropagation();

      const index = pixelToDataIndex(e.clientX);
      if (index === null) return;

      setSelection((prev) => ({
        ...prev,
        endIndex: index,
      }));

      const startDate =
        selection.startIndex !== null
          ? getDateFromIndex(selection.startIndex)
          : null;
      const endDate = getDateFromIndex(index);
      onSelectionChange?.(startDate, endDate);
    },
    [
      enabled,
      selection.isSelecting,
      selection.startIndex,
      pixelToDataIndex,
      getDateFromIndex,
      onSelectionChange,
    ],
  );

  const handleMouseUp = useCallback(
    (e?: React.MouseEvent | MouseEvent) => {
      if (!enabled || !selection.isSelecting) return;

      // Stop propagation to prevent parent handlers from interfering
      if (e && "stopPropagation" in e) {
        e.stopPropagation();
      }

      const { startIndex, endIndex } = selection;

      if (startIndex !== null && endIndex !== null) {
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);

        const startDate = getDateFromIndex(minIndex);
        const endDate = getDateFromIndex(maxIndex);

        if (startDate && endDate) {
          onSelectionComplete?.(startDate, endDate);
        }
      }

      setSelection({
        startIndex: null,
        endIndex: null,
        isSelecting: false,
      });
    },
    [enabled, selection, getDateFromIndex, onSelectionComplete],
  );

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return;

      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSelection({
          startIndex: null,
          endIndex: null,
          isSelecting: false,
        });
        onSelectionChange?.(null, null);
      }
    },
    [enabled, onSelectionChange],
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [enabled, handleClickOutside, handleMouseUp]);

  const clearSelection = useCallback(() => {
    setSelection({
      startIndex: null,
      endIndex: null,
      isSelecting: false,
    });
    onSelectionChange?.(null, null);
  }, [onSelectionChange]);

  return {
    selection,
    isSelecting: selection.isSelecting,
    containerRef,
    chartRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection,
  };
}
