import { globalSearchSchema } from "@api/schemas/search";
import { globalSearchQuery } from "@midday/db/queries";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerSearchTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Require search.read scope
  if (!hasScope(ctx, "search.read")) {
    return;
  }
  server.registerTool(
    "search_global",
    {
      title: "Global Search",
      description:
        "Search across all data: invoices, transactions, customers, documents, and more. Returns ranked results by relevance.",
      inputSchema: globalSearchSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await globalSearchQuery(db, {
        teamId,
        searchTerm: params.searchTerm,
        language: params.language,
        limit: params.limit,
        itemsPerTableLimit: params.itemsPerTableLimit,
        relevanceThreshold: params.relevanceThreshold,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
