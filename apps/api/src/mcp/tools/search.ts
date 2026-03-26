import { globalSearchSchema } from "@api/schemas/search";
import { globalSearchQuery } from "@midday/db/queries";
import { z } from "zod";
import { mcpSearchResultSchema, sanitizeArray } from "../schemas";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";
import { withErrorHandling } from "../utils";

export const registerSearchTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  if (!hasScope(ctx, "search.read")) {
    return;
  }

  server.registerTool(
    "search_global",
    {
      title: "Global Search",
      description:
        "Full-text search across all data types: transactions, invoices, customers, documents, inbox items, and more. Results are ranked by relevance. This is the fastest way to find something when you don't know which domain it belongs to. Returns up to 30 results by default (configurable via limit, max 1000).",
      inputSchema: globalSearchSchema.shape,
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await globalSearchQuery(db, {
        teamId,
        searchTerm: params.searchTerm,
        language: params.language,
        limit: params.limit,
        itemsPerTableLimit: params.itemsPerTableLimit,
        relevanceThreshold: params.relevanceThreshold,
      });

      const clean = sanitizeArray(mcpSearchResultSchema, result ?? []);

      return {
        content: [{ type: "text", text: JSON.stringify(clean) }],
        structuredContent: { data: clean },
      };
    }, "Failed to perform search"),
  );
};
