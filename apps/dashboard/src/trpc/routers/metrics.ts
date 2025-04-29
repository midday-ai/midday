import {
  getBurnRateQuery,
  getExpensesQuery,
  getMetricsQuery,
  getRunwayQuery,
  getSpendingQuery,
} from "@midday/supabase/queries";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const metricsRouter = createTRPCRouter({
  revenue: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        currency: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const data = await getMetricsQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        type: "revenue",
      });

      return data;
    }),

  profit: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        currency: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const data = await getMetricsQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        type: "profit",
      });

      return data;
    }),

  burnRate: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        currency: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await getBurnRateQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });

      return data;
    }),

  runway: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        currency: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await getRunwayQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });

      return data;
    }),

  expense: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        currency: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const data = await getExpensesQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });

      return data;
    }),

  spending: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        currency: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await getSpendingQuery(supabase, {
        teamId: teamId!,
        ...input,
      });

      return data;
    }),
});
