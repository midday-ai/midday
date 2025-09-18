import { openai } from "@ai-sdk/openai";
import type { InferUITools } from "ai";
import { getContext } from "./context";
import { getBurnRateTool } from "./tools/get-burn-rate";

// Tool registry function - this creates the actual tool implementations
export const createToolRegistry = () => {
  const context = getContext();

  return {
    getBurnRate: getBurnRateTool,
    web_search_preview: openai.tools.webSearchPreview({
      searchContextSize: "medium",
      userLocation: {
        type: "approximate",
        country: context.user.country ?? undefined,
        city: context.user.city ?? undefined,
        region: context.user.region ?? undefined,
      },
    }),
  };
};

// Infer the UI tools type from the registry
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;
