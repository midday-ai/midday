import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
  deleteTrackerEntry,
  upsertTrackerEntries,
} from "@midday/supabase/mutations";
import { getTrackerRecordsByDateQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const trackerEntriesRouter = createTRPCRouter({
  byDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      return getTrackerRecordsByDateQuery(supabase, {
        date: input.date,
        teamId: teamId!,
      });
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        start: z.string(),
        stop: z.string(),
        dates: z.array(z.string()),
        assigned_id: z.string(),
        project_id: z.string(),
        description: z.string().optional().nullable(),
        duration: z.number(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await upsertTrackerEntries(supabase, {
        ...input,
        teamId: teamId!,
      });

      return data;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase }, input }) => {
      const { data } = await deleteTrackerEntry(supabase, {
        id: input.id,
      });

      return data;
    }),
});
