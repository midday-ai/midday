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
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const sizeRef = useRef<HTMLDivElement>(null);
  const previousSizeRef = useRef({ width: 0, height: 0 });

  const {
    selection,
    isSelecting,
    containerRef,
    chartRef,
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

  // Notify parent when selection state changes
  useEffect(() => {
    onSelectionStateChange?.(isSelecting);
  }, [isSelecting, onSelectionStateChange]);

  // Measure container size for overlay positioning
  const handleContainerRef = (node: HTMLDivElement | null) => {
    if (node) {
      containerRef.current = node;
      sizeRef.current = node;

      const updateSize = () => {
        if (node) {
          const newWidth = node.offsetWidth;
          const newHeight = node.offsetHeight;

          // Only update if size actually changed
          if (
            previousSizeRef.current.width !== newWidth ||
            previousSizeRef.current.height !== newHeight
          ) {
            previousSizeRef.current = { width: newWidth, height: newHeight };
            setContainerSize({
              width: newWidth,
              height: newHeight,
            });
          }
        }
      };

      updateSize();
    }
  };

  // Set up ResizeObserver for container size tracking
  useEffect(() => {
    const node = sizeRef.current;
    if (!node) return;

    const updateSize = () => {
      const newWidth = node.offsetWidth;
      const newHeight = node.offsetHeight;

      // Only update if size actually changed
      if (
        previousSizeRef.current.width !== newWidth ||
        previousSizeRef.current.height !== newHeight
      ) {
        previousSizeRef.current = { width: newWidth, height: newHeight };
        setContainerSize({
          width: newWidth,
          height: newHeight,
        });
      }
    };

    // Use ResizeObserver if available
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(node);
      return () => observer.disconnect();
    }
  }, []);

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
      }}
    >
      <div ref={chartRef}>{children}</div>
      {containerSize.width > 0 && containerSize.height > 0 && (
        <ChartSelectionOverlay
          data={data}
          selection={selection}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
        />
      )}
    </div>
  );
}
