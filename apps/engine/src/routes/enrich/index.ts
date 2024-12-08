import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { generateObject } from "ai";
import type { Bindings } from "hono/types";
import { createWorkersAI } from "workers-ai-provider";
import { prompt } from "./prompt";
import { EnrichBodySchema, EnrichSchema, OutputSchema } from "./schema";

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
      // @ts-ignore
      const workersai = createWorkersAI({ binding: c.env.AI });
      const result = await generateObject({
        mode: "json",
        // @ts-ignore
        model: workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
        temperature: 0,
        maxTokens: 32768,
        prompt: `
        ${prompt}

        Transactions:
        ${JSON.stringify(data)}
        `,
        // messages: [
        //   {
        //     role: "system" as const,
        //     content: prompt,
        //   },
        //   ...data.map(({ id, ...rest }) => ({
        //     role: "user" as const,
        //     content: JSON.stringify(rest),
        //   })),
        // ],
        schema: OutputSchema,
      });

      return c.json(
        {
          data: result.object.map((result, i) => ({
            id: data[i].id,
            ...result,
          })),
        },
        200,
      );
    } catch (error) {
      console.log(error);
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
