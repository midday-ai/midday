import { openai } from "@ai-sdk/openai";
import type { ToolContext } from "@api/ai/types";
import type { InferUITools } from "ai";
import type { z } from "zod";
import { getBurnRateTool } from "./get-burn-rate";
import { getRevenueTool } from "./get-revenue";
import { getBurnRateSchema, getRevenueSchema } from "./schema";

// Tool schema definitions for validation
export const toolSchemas = {
  getRevenue: getRevenueSchema,
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
} as const;

// Tool registry - maps tool names to their implementations
export const createToolRegistry = (context: ToolContext) => ({
  getRevenue: getRevenueTool(context),
  getBurnRate: getBurnRateTool(context),
  web_search_preview: openai.tools.webSearchPreview({
    searchContextSize: "medium",
    userLocation: {
      type: "approximate",
      country: context.user.country ?? undefined,
      city: context.user.city ?? undefined,
      region: context.user.region ?? undefined,
    },
  }),
});

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
  "data-canvas": {
    presentation: "canvas";
    type: "chart" | "table" | "dashboard" | "report";
    chartType?: "area" | "bar" | "line" | "pie" | "donut";
    title?: string;
    data: any;
    config?: Record<string, any>;
  };
};

export type ToolName = keyof typeof toolSchemas;
export type ToolSchemas = typeof toolSchemas;
export type ToolParams<T extends ToolName> = z.infer<ToolSchemas[T]>;
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;

// Get all available tool names
export function getAvailableTools(): ToolName[] {
  return Object.keys(toolSchemas) as ToolName[];
}
