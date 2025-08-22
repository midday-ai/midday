import {
  createDocumentTag,
  createDocumentTagEmbedding,
  deleteDocumentTag,
  getDocumentTags,
} from "@midday/db/queries";

import {
  createDocumentTagSchema,
  deleteDocumentTagSchema,
} from "@api/schemas/document-tags";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { Embed } from "@midday/documents/embed";
import slugify from "@sindresorhus/slugify";

export const documentTagsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getDocumentTags(db, teamId!);
  }),

  create: protectedProcedure
    .input(createDocumentTagSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const data = await createDocumentTag(db, {
        teamId: teamId!,
        name: input.name,
        slug: slugify(input.name),
      });

      // If a tag is created, we need to embed it
      if (data) {
        const embedService = new Embed();
        const embedding = await embedService.embed(input.name);

        await createDocumentTagEmbedding(db, {
          slug: data.slug,
          name: input.name,
          embedding: JSON.stringify(embedding),
        });
      }

      return data;
    }),

  delete: protectedProcedure
    .input(deleteDocumentTagSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteDocumentTag(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),
});
