import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { generateObject } from "ai";
import { env } from "hono/adapter";
import type { Bindings } from "hono/types";
import { createWorkersAI } from "workers-ai-provider";
import { z } from "zod";
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
    try {
      const workersai = createWorkersAI({ binding: env.AI });
      const result = await generateObject({
        model: workersai("@cf/meta/llama-2-70b-chat"),
        prompt: `You are a financial transaction categorization specialist. Your task is to analyze transaction descriptions and assign them to the most appropriate category from the following list. Consider the context, merchant type, and transaction patterns when making your decision.
        Categories:
        - travel: For transportation, accommodation, and travel-related expenses
        - office_supplies: For stationery, printing materials, and general office consumables
        - meals: For food, dining, and restaurant expenses
        - software: For digital tools, subscriptions, and software licenses
        - rent: For property rental and lease payments
        - equipment: For hardware, machinery, and durable business assets
        - transfer: For fund movements between accounts
        - internet_and_telephone: For connectivity and communication services
        - facilities_expenses: For utilities, maintenance, and building-related costs
        - activity: For events, entertainment, and business activities
        - taxes: For government levies and tax payments
        - fees: For service charges, professional fees, and administrative costs

        Analyze the following transaction and categorize it appropriately.`,
        schema: z.array(
          z.object({
            category: z
              .enum([
                "travel",
                "office_supplies",
                "meals",
                "software",
                "rent",
                "equipment",
                "transfer",
                "internet_and_telephone",
                "facilities_expenses",
                "activity",
                "taxes",
                "fees",
              ])
              .describe("The category of the transaction"),
            company: z.string().describe("The company name"),
            website: z.string().url().describe("The website of the company"),
            subscription: z
              .boolean()
              .describe(
                "Whether the transaction is a recurring subscription payment",
              ),
          }),
        ),
      });

      return c.json(
        {
          data: result.object,
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
