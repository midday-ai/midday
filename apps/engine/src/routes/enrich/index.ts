import { GeneralErrorSchema } from "@/common/schema";
import { generateEnrichedCacheKey } from "@/utils/enrich";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { generateObject } from "ai";
import type { Bindings } from "hono/types";
import { type WorkersAI, createWorkersAI } from "workers-ai-provider";
import { prompt } from "./prompt";
import {
  type EnrichBody,
  EnrichBodySchema,
  EnrichSchema,
  OutputSchema,
} from "./schema";

async function enrichTransactions(
  model: WorkersAI,
  transaction: EnrichBody["data"][0],
) {
  const result = await generateObject({
    mode: "json",
    // @ts-ignore
    model: model("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
    temperature: 0,
    maxTokens: 2048,
    prompt: `
          ${prompt}

          Transaction:
          ${JSON.stringify(transaction)}
      `,
    schema: OutputSchema,
  });

  return result.object;
}

const app = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Enrich transactions",
    request: {
      body: {
        content: {
          "application/json": {
            schema: EnrichBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: EnrichSchema,
          },
        },
        description: "Enrich a transaction",
      },
      400: {
        content: {
          "application/json": {
            schema: GeneralErrorSchema,
          },
        },
        description: "Returns an error",
      },
    },
  }),
  async (c) => {
    const { data } = c.req.valid("json");
    // @ts-ignore
    const workersai = createWorkersAI({ binding: c.env.AI });

    try {
      const results = [];

      for (const transaction of data) {
        const enrichedKey = generateEnrichedCacheKey(transaction);
        // @ts-ignore
        const enrichedResult = await c.env.ENRICH_KV.get(enrichedKey, {
          type: "json",
        });

        if (enrichedResult) {
          results.push({ ...transaction, ...enrichedResult, source: "cache" });
        } else {
          // @ts-ignore
          const enrichment = await enrichTransactions(workersai, transaction);

          // @ts-ignore
          await c.env.ENRICH_KV.put(enrichedKey, JSON.stringify(enrichment), {
            expirationTtl: 604800,
          });

          results.push({ ...transaction, ...enrichment, source: "model" });
        }
      }

      return c.json(
        {
          data: results,
        },
        200,
      );
    } catch (error) {
      return c.json(
        {
          error: "Internal server error",
          message: "Internal server error",
          requestId: c.get("requestId"),
          code: "400",
        },
        400,
      );
    }
  },
);

export default app;
