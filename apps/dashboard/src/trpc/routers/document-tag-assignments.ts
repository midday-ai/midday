import {
  createDocumentTagAssignment,
  deleteDocumentTagAssignment,
} from "@midday/supabase/mutations";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

export const documentTagAssignmentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await createDocumentTagAssignment(supabase, {
        documentId: input.documentId,
        tagId: input.tagId,
        teamId: teamId!,
      });

      return data;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await deleteDocumentTagAssignment(supabase, {
        documentId: input.documentId,
        tagId: input.tagId,
        teamId: teamId!,
      });

      return data;
    }),
});
