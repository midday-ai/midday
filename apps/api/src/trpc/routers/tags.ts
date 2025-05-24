import { getTags } from "@api/db/queries/tags";
import { createTag, deleteTag, updateTag } from "@api/db/queries/tags";
import {
  createTagSchema,
  deleteTagSchema,
  updateTagSchema,
} from "@api/schemas/tags";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";

export const tagsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTags(db, {
      teamId: teamId!,
    });
  }),

  create: protectedProcedure
    .input(createTagSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return createTag(db, {
        teamId: teamId!,
        name: input.name,
      });
    }),

  delete: protectedProcedure
    .input(deleteTagSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteTag(db, input.id);
    }),

  update: protectedProcedure
    .input(updateTagSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return updateTag(db, {
        id: input.id,
        name: input.name,
      });
    }),
});
