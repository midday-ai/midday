import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { Embed } from "@midday/documents/embed";
import {
  createDocumentTag,
  createDocumentTagEmbedding,
  deleteDocumentTag,
} from "@midday/supabase/mutations";
import { getDocumentTagsQuery } from "@midday/supabase/queries";
import slugify from "@sindresorhus/slugify";
import { z } from "zod";

export const documentTagsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getDocumentTagsQuery(supabase, teamId!);

    return data;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await createDocumentTag(supabase, {
        teamId: teamId!,
        name: input.name,
        slug: slugify(input.name),
      });

      // If a tag is created, we need to embed it
      if (data) {
        const embedService = new Embed();
        const embedding = await embedService.embed(input.name);

        await createDocumentTagEmbedding(supabase, {
          slug: data.slug,
          name: input.name,
          embedding: JSON.stringify(embedding),
        });
      }

      return data;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await deleteDocumentTag(supabase, {
        id: input.id,
        teamId: teamId!,
      });

      return data;
    }),
});
