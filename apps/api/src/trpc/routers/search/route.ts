import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  globalSearchQuery,
  globalSemanticSearchQuery,
} from "@midday/supabase/queries";
import { z } from "zod";
import { generateLLMFilters } from "./llm";

export const searchRouter = createTRPCRouter({
  global: protectedProcedure
    .input(
      z.object({
        searchTerm: z.string().optional(),
        language: z.string().optional(),
        limit: z.number().default(30),
        itemsPerTableLimit: z.number().default(5),
        relevanceThreshold: z.number().default(0.01),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { searchTerm } = input;

      // Determine if we should fall back to LLM-generated filters:
      // we only do this when the user provides a multi-word query.
      const shouldUseLLMFilters =
        !!searchTerm && searchTerm.trim().split(/\s+/).length > 1;

      const results = await globalSearchQuery(supabase, {
        teamId: teamId!,
        ...input,
        searchTerm: searchTerm ?? undefined,
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
          ? 0.9
          : input.relevanceThreshold,
      });

      if (shouldUseLLMFilters && !results?.data?.length) {
        const filters = await generateLLMFilters(searchTerm);

        const semanticResults = await globalSemanticSearchQuery(supabase, {
          teamId: teamId!,
          itemsPerTableLimit: input.itemsPerTableLimit,
          ...filters,
        });

        console.log(semanticResults);

        return semanticResults;
      }

      return results;
    }),
});
