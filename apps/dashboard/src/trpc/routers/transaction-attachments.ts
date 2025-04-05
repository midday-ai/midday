import {
  createAttachments,
  deleteAttachment,
} from "@midday/supabase/mutations";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

export const transactionAttachmentsRouter = createTRPCRouter({
  createMany: protectedProcedure
    .input(
      z.array(
        z.object({
          path: z.array(z.string()),
          name: z.string(),
          size: z.number(),
          transaction_id: z.string(),
          type: z.string(),
        }),
      ),
    )
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await createAttachments(supabase, {
        teamId: teamId!,
        attachments: input,
      });

      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteAttachment(supabase, input.id);

      return data;
    }),
});
