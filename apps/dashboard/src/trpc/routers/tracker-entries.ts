import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
  createTrackerEntries,
  deleteTrackerEntry,
} from "@midday/supabase/mutations";
import { getTagsQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const trackerEntriesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getTagsQuery(supabase, teamId!);

    return data;
  }),

  createMany: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        start: z.string(),
        stop: z.string(),
        dates: z.array(z.string()),
        assigned_id: z.string(),
        project_id: z.string(),
        description: z.string().optional(),
        duration: z.number(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await createTrackerEntries(supabase, {
        entries: [input],
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
