import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getInsightById,
  getInsightByPeriod,
  getInsights,
  getLatestInsight,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const periodTypeEnum = z.enum(["weekly", "monthly", "quarterly", "yearly"]);

export const insightsRouter = createTRPCRouter({
  /**
   * Get paginated list of insights for the team
   */
  list: protectedProcedure
    .input(
      z.object({
        periodType: periodTypeEnum.optional(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInsights(db, {
        teamId: teamId!,
        periodType: input.periodType,
        pageSize: input.limit,
        cursor: input.cursor,
        status: "completed",
      });
    }),

  /**
   * Get the most recent completed insight
   */
  latest: protectedProcedure
    .input(
      z.object({
        periodType: periodTypeEnum.optional(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getLatestInsight(db, {
        teamId: teamId!,
        periodType: input.periodType,
      });
    }),

  /**
   * Get a specific insight by ID
   */
  byId: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const insight = await getInsightById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!insight) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Insight not found",
        });
      }

      return insight;
    }),

  /**
   * Get insight for a specific period
   */
  byPeriod: protectedProcedure
    .input(
      z.object({
        periodType: periodTypeEnum,
        periodYear: z.number(),
        periodNumber: z.number(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const insight = await getInsightByPeriod(db, {
        teamId: teamId!,
        periodType: input.periodType,
        periodYear: input.periodYear,
        periodNumber: input.periodNumber,
      });

      if (!insight) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Insight not found for this period",
        });
      }

      return insight;
    }),
});
