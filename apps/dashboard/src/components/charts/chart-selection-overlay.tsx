"use client";

import type { PlotArea } from "@/hooks/use-chart-selection";

interface ChartSelectionOverlayProps {
  data: any[];
  selection: {
    startIndex: number | null;
    endIndex: number | null;
    isSelecting: boolean;
  };
  plotArea: PlotArea | null;
}

export function ChartSelectionOverlay({
  data,
  selection,
  plotArea,
}: ChartSelectionOverlayProps) {
  if (
    !plotArea ||
    selection.startIndex === null ||
    selection.endIndex === null ||
    data.length === 0
  ) {
    return null;
  }

  const minIndex = Math.min(selection.startIndex, selection.endIndex);
  const maxIndex = Math.max(selection.startIndex, selection.endIndex);

  const barWidth = plotArea.width / data.length;
  const startPos = plotArea.x + minIndex * barWidth;
  const endPos = plotArea.x + (maxIndex + 1) * barWidth;
  const width = endPos - startPos;

  return (
    <>
      {/* Selection overlay - shaded rectangle */}
      <div
        className="absolute pointer-events-none chart-selection-overlay"
        style={{
          left: `${startPos}px`,
          top: `${plotArea.y}px`,
          width: `${width}px`,
          height: `${plotArea.height}px`,
          background: "rgba(0, 0, 0, 0.08)",
          zIndex: 1,
        }}
      />
      {/* Start line */}
      <div
        className="absolute pointer-events-none chart-selection-border"
        style={{
          left: `${startPos}px`,
          top: `${plotArea.y}px`,
          width: "1px",
          height: `${plotArea.height}px`,
          borderLeft: "1px dashed #666666",
          zIndex: 2,
        }}
      />
      {/* End line */}
      <div
        className="absolute pointer-events-none chart-selection-border"
        style={{
          left: `${endPos}px`,
          top: `${plotArea.y}px`,
          width: "1px",
          height: `${plotArea.height}px`,
          borderLeft: "1px dashed #666666",
          zIndex: 2,
        }}
      />
    </>
  );
}
