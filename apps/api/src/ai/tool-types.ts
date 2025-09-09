import { openai } from "@ai-sdk/openai";
import type { ToolContext } from "@api/ai/context";
import type { InferUITools } from "ai";
import { getBurnRateTool } from "./tools/get-burn-rate";
import { getExpensesTool } from "./tools/get-expenses";
import { getRevenueTool } from "./tools/get-revenue";

// Tool registry function - this creates the actual tool implementations
export const createToolRegistry = (context: ToolContext) => ({
  getRevenue: getRevenueTool(context),
  getBurnRate: getBurnRateTool(context),
  getExpenses: getExpensesTool(context),
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

// Infer the UI tools type from the registry
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;
