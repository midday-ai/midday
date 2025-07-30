import type { Context } from "@api/rest/types";
import { globalSearchSchema, searchResponseSchema } from "@api/schemas/search";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { globalSearchQuery } from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Search",
    operationId: "search",
    "x-speakeasy-name-override": "search",
    description:
      "Search across all data, invoices, documents, customers, transactions, and more.",
    tags: ["Search"],
    request: {
      query: globalSearchSchema,
    },
    responses: {
      200: {
        description: "Search results.",
        content: {
          "application/json": {
            schema: searchResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("search.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { searchTerm, ...input } = c.req.valid("query");

    const results = await globalSearchQuery(db, {
      teamId: teamId!,
      ...input,
      searchTerm: searchTerm,
      /**
       * Tighten the relevance threshold whenever the user enters a multi-word query.
       *
       * Rationale:
       * 1. A longer query usually implies a more specific intent, so we only want
       *    results that score highly on relevance.
       * 2. If this stricter search returns nothing, we immediately fall back to the
       *    LLM-generated filter logic below.  By filtering aggressively here we avoid
       *    surfacing low-quality matches and give the LLM a chance to produce a more
       *    intelligent result instead.
       */
      relevanceThreshold: 0.01,
      // relevanceThreshold: shouldUseLLMFilters
      //   ? 0.9
      //   : input.relevanceThreshold,
    });

    return c.json(validateResponse(results, searchResponseSchema));
  },
);

export const searchRouter = app;
