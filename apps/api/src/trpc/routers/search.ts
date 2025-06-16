import { globalSearchSchema } from "@api/schemas/search";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { generateLLMFilters } from "@api/utils/search-filters";
import {
  globalSearchQuery,
  globalSemanticSearchQuery,
} from "@midday/db/queries";

export const searchRouter = createTRPCRouter({
  global: protectedProcedure
    .input(globalSearchSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const { searchTerm } = input;

      // Determine if we should fall back to LLM-generated filters:
      // we only do this when the user provides a multi-word query.
      const shouldUseLLMFilters =
        !!searchTerm && searchTerm.trim().split(/\s+/).length > 1;

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
        relevanceThreshold: shouldUseLLMFilters
          ? 0.01
          : input.relevanceThreshold,
      });

      if (shouldUseLLMFilters && !results.length) {
        const filters = await generateLLMFilters(searchTerm);

        const semanticResults = await globalSemanticSearchQuery(db, {
          teamId: teamId!,
          itemsPerTableLimit: input.itemsPerTableLimit,
          ...filters,
        });

        return semanticResults;
      }

      return results;
    }),
});
