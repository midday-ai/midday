import { openai } from "@ai-sdk/openai";
import type { AppContext } from "@api/ai/agents/config/shared";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

interface SourceItem {
  url: string;
  title: string;
  publishedDate?: string;
}

export const webSearchTool = tool({
  description:
    "Search the web for current information, prices, news, and external data.",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ query }, executionOptions) => {
    const appContext = executionOptions.experimental_context as AppContext;

    try {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `<search-request>
                  Search for: ${query}
                  Current date: ${appContext.currentDateTime}
                  Focus on recent information.
                </search-request>`,
        stopWhen: stepCountIs(1),
        tools: {
          web_search: openai.tools.webSearch({
            searchContextSize: "low",
            userLocation: {
              type: "approximate" as const,
              country: appContext.country,
              timezone: appContext.timezone,
            },
          }),
        },
        temperature: 0,
      });

      const rawSources: Array<{ url: string; title?: string }> = [];

      if (result.steps?.[0]?.content) {
        const content = result.steps[0].content;
        if (Array.isArray(content)) {
          for (const item of content) {
            if (item.type === "source" && item.sourceType === "url") {
              rawSources.push({
                url: item.url,
                title: item.title || item.url,
              });
            }
          }
        }
      }

      const formattedSources: SourceItem[] = rawSources
        .slice(0, 3)
        .map((source) => ({
          url: source.url,
          title: source.title || source.url,
        }));

      const contextData = result.text || "";

      return {
        query,
        found: formattedSources.length,
        context: contextData,
        sources: formattedSources,
      };
    } catch (error) {
      return {
        query,
        found: 0,
        context: null,
        sources: [],
        error: error instanceof Error ? error.message : "Search failed",
      };
    }
  },
});
