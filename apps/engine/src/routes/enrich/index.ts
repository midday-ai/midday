import { GeneralErrorSchema } from "@/common/schema";
import { enrichTransactionWithLLM } from "@/utils/enrich";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { Bindings } from "hono/types";
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

    try {
      const enrichments = await Promise.all(
        data.map(async ({ id, ...transaction }) => {
          // @ts-ignore
          const enrichment = await enrichTransactionWithLLM(c, transaction);
          return {
            id,
            ...enrichment,
          };
        }),
      );

      return c.json(
        {
          data: enrichments,
        },
        200,
      );
    } catch (error) {
      console.error(error);
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
