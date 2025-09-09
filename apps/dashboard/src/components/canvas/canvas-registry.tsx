import type { BurnRateCanvasData } from "@api/ai/canvas/burn-rate-canvas-tool";
import type { ExpenseCanvasData } from "@api/ai/canvas/expense-canvas-tool";
import type { ComponentType } from "react";
import { BurnRateAnalysisCanvas } from "./burn-rate-analysis-canvas";
import { ExpenseAnalysisCanvas } from "./expense-analysis-canvas";

// Unified canvas component interface - all canvas components receive canvasData prop
interface CanvasComponentProps<T> {
  canvasData: T;
}

// Canvas component registry with consistent typing
export const CANVAS_COMPONENTS = {
  "expense-analysis": ExpenseAnalysisCanvas as ComponentType<
    CanvasComponentProps<ExpenseCanvasData>
  >,
  "burn-rate-analysis": BurnRateAnalysisCanvas as ComponentType<
    CanvasComponentProps<BurnRateCanvasData>
  >,
} as const;

export type CanvasType = keyof typeof CANVAS_COMPONENTS;

// Canvas data type mapping - uses tool result types
export interface CanvasDataMap {
  "expense-analysis": ExpenseCanvasData;
  "burn-rate-analysis": BurnRateCanvasData;
}

// Type-safe canvas renderer - automatically handles all canvas types
export function renderCanvas<T extends CanvasType>(
  type: T,
  canvasData: CanvasDataMap[T],
): React.ReactElement | null {
  const CanvasComponent = CANVAS_COMPONENTS[type];

  if (!CanvasComponent) {
    console.warn(`Unknown canvas type: ${type}`);
    return null;
  }

  // All canvas components follow the same prop pattern: { canvasData: CanvasData }
  // This eliminates the need for a switch statement and automatically works for new canvas types
  return <CanvasComponent canvasData={canvasData} />;
}
