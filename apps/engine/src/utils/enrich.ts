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

export function createCacheMiddleware(c: Context<{ Bindings: Bindings }>) {
  return {
    // @ts-ignore
    wrapGenerate: async ({ doGenerate, params }) => {
      const cacheKey = JSON.stringify(params);

      const cached = (await c.env.ENRICH_KV.get(cacheKey)) as Awaited<
        ReturnType<LanguageModelV1["doGenerate"]>
      > | null;

      if (cached !== null) {
        return {
          ...cached,
          response: {
            ...cached.response,
            timestamp: cached?.response?.timestamp
              ? new Date(cached?.response?.timestamp)
              : undefined,
            source: "cached",
          },
        };
      }

      const result = await doGenerate();

      await c.env.ENRICH_KV.put(cacheKey, {
        ...result,
        response: {
          ...result.response,
          source: "model",
        },
      });

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
  data: EnrichBody["data"],
) {
  const model = createWorkersAI({ binding: c.env.AI });

  const wrappedLanguageModel = wrapLanguageModel({
    // @ts-ignore
    model: model("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
    middleware: createCacheMiddleware(c),
  });

  const result = await generateObject({
    mode: "json",
    // @ts-ignore
    model: wrappedLanguageModel,
    temperature: 0,
    maxTokens: 2048,
    prompt: `
            ${prompt}
  
            Transactions:
            ${JSON.stringify(data)}
        `,
    schema: OutputSchema,
  });

  return result.object;
}
