import { GeneralErrorSchema } from "@/common/schema";
import { generateEnrichedCacheKey } from "@/utils/enrich";
import { callEnrichmentLLM } from "@/utils/enrich";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { Bindings } from "hono/types";
import { createWorkersAI } from "workers-ai-provider";
import { EnrichBodySchema, EnrichSchema } from "./schema";

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
          results.push({
            id: transaction.id,
            ...enrichedResult,
            source: "cache",
          });
        } else {
          // @ts-ignore
          const enrichment = await callEnrichmentLLM(workersai, transaction);

          // @ts-ignore
          await c.env.ENRICH_KV.put(enrichedKey, JSON.stringify(enrichment), {
            expirationTtl: 604800,
          });

          results.push({ id: transaction.id, ...enrichment, source: "model" });
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
