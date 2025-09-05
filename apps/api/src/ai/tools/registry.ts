import type { ToolContext } from "@api/ai/types";
import type { InferUITools } from "ai";
import type { z } from "zod";
import { getRevenueTool } from "./get-revenue";
import { getRevenueSchema } from "./schema";

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
} as const;

// Tool registry - maps tool names to their implementations
export const createToolRegistry = (context: ToolContext) => ({
  getRevenue: getRevenueTool(context),
});

// Type helpers
// Define data part types for streaming data
export type MessageDataParts = {
  title: {
    title: string;
  };
};

export type ToolName = keyof typeof toolSchemas;
export type ToolSchemas = typeof toolSchemas;
export type ToolParams<T extends ToolName> = z.infer<ToolSchemas[T]>;
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;

// Validate tool parameters
export function validateToolParams<T extends ToolName>(
  toolName: T,
  params: unknown,
): ToolParams<T> {
  const schema = toolSchemas[toolName];
  return schema.parse(params);
}

// Get all available tool names
export function getAvailableTools(): ToolName[] {
  return Object.keys(toolSchemas) as ToolName[];
}
