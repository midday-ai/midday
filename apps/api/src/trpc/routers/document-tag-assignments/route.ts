import {
  createDocumentTagAssignment,
  deleteDocumentTagAssignment,
} from "@api/db/queries/document-tag-assignments";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createDocumentTagAssignmentSchema,
  deleteDocumentTagAssignmentSchema,
} from "./schema";

export const documentTagAssignmentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createDocumentTagAssignmentSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return createDocumentTagAssignment(db, {
        documentId: input.documentId,
        tagId: input.tagId,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteDocumentTagAssignmentSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteDocumentTagAssignment(db, {
        documentId: input.documentId,
        tagId: input.tagId,
      });
    }),
});
