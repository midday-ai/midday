import {
  createDocumentTagAssignmentSchema,
  deleteDocumentTagAssignmentSchema,
} from "@api/schemas/document-tag-assignments";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createDocumentTagAssignment,
  deleteDocumentTagAssignment,
} from "@midday/db/queries";

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
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteDocumentTagAssignment(db, {
        documentId: input.documentId,
        tagId: input.tagId,
        teamId: teamId!,
      });
    }),
});
