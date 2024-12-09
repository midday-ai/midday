import type { Bindings } from "@/common/bindings";
import { type EnrichBody, OutputSchema } from "@/routes/enrich/schema";
import {
  type LanguageModelV1,
  type Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware,
  generateObject,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from "ai";
import type { Context } from "hono";
import { createWorkersAI } from "workers-ai-provider";
import { prompt } from "./prompt";

function generateCacheKey(description: string): string {
  return description.toLowerCase().replace(/\s+/g, "_");
}

export function createCacheMiddleware(
  c: Context<{ Bindings: Bindings }>,
  description: string,
): LanguageModelV1Middleware {
  return {
    wrapGenerate: async ({ doGenerate }) => {
      const cacheKey = generateCacheKey(description);

      const cached = (await c.env.ENRICH_KV.get(cacheKey, {
        type: "json",
      })) as Awaited<ReturnType<LanguageModelV1["doGenerate"]>> | null;

      if (cached !== null) {
        return {
          ...cached,
          response: {
            ...cached.response,
            timestamp: cached?.response?.timestamp
              ? new Date(cached?.response?.timestamp)
              : undefined,
          },
        };
      }

      const result = await doGenerate();

      await c.env.ENRICH_KV.put(cacheKey, JSON.stringify(result));

      return {
        ...result,
        response: {
          ...result.response,
          source: "model",
        },
      };
    },
  };
}

export async function enrichTransactionWithLLM(
  c: Context<{ Bindings: Bindings }>,
  data: EnrichBody["data"][number],
) {
  const model = createWorkersAI({ binding: c.env.AI });

  const wrappedLanguageModel = wrapLanguageModel({
    // @ts-ignore (Not available in the SDK)
    model: model("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
    middleware: createCacheMiddleware(c, data.description),
  });

  const result = await generateObject({
    mode: "json",
    model: wrappedLanguageModel,
    temperature: 0,
    maxTokens: 2048,
    prompt: `
            ${prompt}
  
            Transaction:
            ${JSON.stringify(data)}
        `,
    schema: OutputSchema,
  });

  return result.object;
}
