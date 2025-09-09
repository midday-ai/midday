import type { z } from "zod";
import type { CanvasData } from "./canvas-types";
import {
  getBurnRateSchema,
  getExpensesSchema,
  getRevenueSchema,
} from "./schema";

// Tool schema definitions for validation
export const toolSchemas = {
  getRevenue: getRevenueSchema,
  getExpenses: getExpensesSchema,
  getBurnRate: getBurnRateSchema,
} as const;

// Tool metadata for UI and validation
export const toolMetadata = {
  getRevenue: {
    name: "getRevenue",
    description:
      "Get revenue for a period, including total and a monthly breakdown",
    inputSchema: getRevenueSchema,
  },
  getBurnRate: {
    name: "getBurnRate",
    description:
      "Get burn rate for a period, including total and a monthly breakdown",
    inputSchema: getBurnRateSchema,
  },
  getExpenses: {
    name: "getExpenses",
    description:
      "Get comprehensive expense analysis for a period, including monthly breakdown, category analysis, and spending insights",
    inputSchema: getExpensesSchema,
  },
} as const;

// Tool registry is now defined in tool-types.ts to avoid circular dependencies

// Type helpers
// Define data part types for streaming data that will be added to message parts
export type MessageDataParts = {
  title: {
    title: string;
  };
  "data-canvas-title": {
    presentation: "canvas";
    type: "canvas-title";
    title: string;
  };
  "data-canvas": CanvasData;
};

export type ToolName = keyof typeof toolSchemas;
export type ToolSchemas = typeof toolSchemas;
export type ToolParams<T extends ToolName> = z.infer<ToolSchemas[T]>;
// UITools is now defined in types.ts to avoid circular dependency

// Get all available tool names
export function getAvailableTools(): ToolName[] {
  return Object.keys(toolSchemas) as ToolName[];
}
