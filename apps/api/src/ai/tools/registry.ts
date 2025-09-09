// Tool metadata for title generation and UI display
export const toolMetadata = {
  getBurnRate: {
    name: "getBurnRate",
    description:
      "Get burn rate analysis with runway projections and optimization recommendations",
  },
  getExpenses: {
    name: "getExpenses",
    description:
      "Get comprehensive expense analysis with transaction breakdown and spending insights",
  },
} as const;

export type ToolName = keyof typeof toolMetadata;

// Type helpers
// Define data part types for streaming data that will be added to message parts
export type MessageDataParts = {
  title: {
    title: string;
  };
  "data-canvas": ExpenseCanvasData | BurnRateCanvasData; // Canvas data type for all canvas content
};

// Import inferred types from tools
export type { ExpenseCanvasData } from "../canvas/expense-canvas-tool";
export type { BurnRateCanvasData } from "../canvas/burn-rate-canvas-tool";
