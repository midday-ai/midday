import {
  getBurnRateQuery,
  getExpensesQuery,
  getMetricsQuery,
  getRunwayQuery,
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
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const data = await getMetricsQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        type: "revenue",
      });

      return data;
    }),

  profit: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const data = await getMetricsQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        type: "profit",
      });

      return data;
    }),

  burnRate: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const data = await getBurnRateQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
      });

      return data;
    }),

  runway: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const data = await getRunwayQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
      });

      return data;
    }),

  expense: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const data = await getExpensesQuery(supabase, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
      });

      return data;
    }),
});
