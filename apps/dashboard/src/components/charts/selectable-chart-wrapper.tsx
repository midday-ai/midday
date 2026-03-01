"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useChartSelection } from "@/hooks/use-chart-selection";
import { ChartSelectionOverlay } from "./chart-selection-overlay";

interface SelectableChartWrapperProps {
  children: ReactNode;
  data: any[];
  dateKey: string;
  enableSelection?: boolean;
  onSelectionChange?: (
    startDate: string | null,
    endDate: string | null,
  ) => void;
  onSelectionComplete?: (startDate: string, endDate: string) => void;
  onSelectionStateChange?: (isSelecting: boolean) => void;
  chartType?: string;
}

export function SelectableChartWrapper({
  children,
  data,
  dateKey,
  enableSelection = false,
  onSelectionChange,
  onSelectionComplete,
  onSelectionStateChange,
  chartType,
}: SelectableChartWrapperProps) {
  const [containerReady, setContainerReady] = useState(false);
  const sizeRef = useRef<HTMLDivElement>(null);

  const {
    selection,
    isSelecting,
    containerRef,
    chartRef,
    getPlotArea,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useChartSelection({
    data,
    dateKey,
    enabled: enableSelection,
    onSelectionChange,
    onSelectionComplete: (startDate, endDate) => {
      onSelectionComplete?.(startDate, endDate);
    },
  });

  useEffect(() => {
    onSelectionStateChange?.(isSelecting);
  }, [isSelecting, onSelectionStateChange]);

  const handleContainerRef = (node: HTMLDivElement | null) => {
    if (node) {
      containerRef.current = node;
      sizeRef.current = node;
      setContainerReady(true);
    }
  };

  if (!enableSelection) {
    return <>{children}</>;
  }

  return (
    <div
      ref={handleContainerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={(e) => handleMouseUp(e)}
      style={{
        position: "relative",
        cursor: selection.isSelecting ? "col-resize" : "default",
        userSelect: selection.isSelecting ? "none" : "auto",
      }}
    >
      <div ref={chartRef}>{children}</div>
      {containerReady && (
        <ChartSelectionOverlay
          data={data}
          selection={selection}
          plotArea={getPlotArea()}
        />
      )}
    </div>
  );
}
