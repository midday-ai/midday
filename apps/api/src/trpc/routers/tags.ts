import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { createTag, deleteTag, updateTag } from "@midday/supabase/mutations";
import { getTagsQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const tagsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getTagsQuery(supabase, teamId!);

    return data;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await createTag(supabase, {
        teamId: teamId!,
        name: input.name,
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
      const { data } = await deleteTag(supabase, {
        id: input.id,
      });

      return data;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase }, input }) => {
      const { data } = await updateTag(supabase, {
        id: input.id,
        name: input.name,
      });

      return data;
    }),
});
