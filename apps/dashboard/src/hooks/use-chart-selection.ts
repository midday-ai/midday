"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ChartSelection {
  startIndex: number | null;
  endIndex: number | null;
  isSelecting: boolean;
}

export interface PlotArea {
  x: number;
  width: number;
  y: number;
  height: number;
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

function readPlotArea(chartEl: HTMLElement | null): PlotArea | null {
  if (!chartEl) return null;

  const hLine = chartEl.querySelector(
    ".recharts-cartesian-grid-horizontal line",
  );
  const vLine = chartEl.querySelector(".recharts-cartesian-grid-vertical line");

  if (!hLine) return null;

  const x = Number.parseFloat(hLine.getAttribute("x1") || "0");
  const x2 = Number.parseFloat(hLine.getAttribute("x2") || "0");
  const width = x2 - x;

  let y = 0;
  let height = 0;
  if (vLine) {
    y = Number.parseFloat(vLine.getAttribute("y1") || "0");
    const y2 = Number.parseFloat(vLine.getAttribute("y2") || "0");
    height = y2 - y;
  }

  if (width <= 0) return null;

  return { x, width, y, height };
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
  const chartRef = useRef<HTMLDivElement>(null);

  const getPlotArea = useCallback((): PlotArea | null => {
    return readPlotArea(chartRef.current);
  }, []);

  const pixelToDataIndex = useCallback(
    (x: number): number | null => {
      if (!containerRef.current || data.length === 0) return null;

      const plotArea = getPlotArea();
      if (!plotArea) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const chartX = x - rect.left;

      const barWidth = plotArea.width / data.length;
      const plotX = chartX - plotArea.x;
      const index = Math.floor(plotX / barWidth);

      if (index < 0) return 0;
      if (index >= data.length) return data.length - 1;

      return index;
    },
    [data, getPlotArea],
  );

  const getDateFromIndex = useCallback(
    (index: number): string | null => {
      if (index < 0 || index >= data.length) return null;
      const item = data[index];
      const dateValue = item[dateKey];

      if (typeof dateValue === "string") {
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
    getPlotArea,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection,
  };
}
