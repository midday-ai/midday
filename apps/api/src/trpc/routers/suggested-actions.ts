import { getSuggestedActionsSchema } from "@api/schemas/suggested-actions";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { suggestedActionsCache } from "@midday/cache/suggested-actions-cache";
import { endOfMonth, subMonths } from "date-fns";

// Define the static suggested actions configuration
const SUGGESTED_ACTIONS_CONFIG = [
  {
    id: "get-burn-rate-analysis",
    toolName: "getBurnRateAnalysis",
    toolParams: {
      showCanvas: true,
    },
  },
  {
    id: "latest-transactions",
    toolName: "getTransactions",
    toolParams: {
      pageSize: 10,
      sort: ["date", "desc"],
    },
  },
  {
    id: "expenses-breakdown",
    toolName: "getExpensesBreakdown",
    toolParams: {
      showCanvas: true,
    },
  },
  {
    id: "balance-sheet",
    toolName: "getBalanceSheet",
    toolParams: {
      showCanvas: true,
    },
  },
] as const;

export const suggestedActionsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(getSuggestedActionsSchema)
    .query(async ({ ctx: { teamId, session }, input }) => {
      const userId = session.user.id;

      // Get usage data for all actions

      const allUsage = await suggestedActionsCache.getAllUsage(teamId!, userId);

      // Map actions with usage data and sort by usage count (descending) then by recency
      const actionsWithUsage = SUGGESTED_ACTIONS_CONFIG.map((action) => {
        const usage = allUsage[action.id];

        return {
          id: action.id,
          toolName: action.toolName,
          toolParams: action.toolParams,
          usageCount: usage?.count || 0,
          lastUsed: usage?.lastUsed ? new Date(usage.lastUsed) : null,
        };
      })
        .sort((a, b) => {
          // Sort by usage count first (descending)
          if (a.usageCount !== b.usageCount) {
            return b.usageCount - a.usageCount;
          }

          // Then by recency (most recent first)
          if (a.lastUsed && b.lastUsed) {
            return b.lastUsed.getTime() - a.lastUsed.getTime();
          }

          // If one has been used and the other hasn't, prioritize the used one
          if (a.lastUsed && !b.lastUsed) return -1;
          if (!a.lastUsed && b.lastUsed) return 1;

          // If neither has been used, maintain original order
          return 0;
        })
        .slice(0, input.limit);

      return {
        actions: actionsWithUsage,
        total: SUGGESTED_ACTIONS_CONFIG.length,
      };
    }),
});
