import { getDocumentTagsQuery } from "@midday/supabase/queries";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const documentTagsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getDocumentTagsQuery(supabase, teamId!);

    return data;
  }),

  //   create: protectedProcedure
  //     .input(
  //       z.object({
  //           transactionId: z.string(),
  //           tagId: z.string(),
  //         }),
  //       )
  //       .mutation(async ({ ctx: { supabase, teamId }, input }) => {
  //         const { data } = await createTransactionTag(supabase, {
  //           teamId: teamId!,
  //           transactionId: input.transactionId,
  //           tagId: input.tagId,
  //         });

  //         return data;
  //       }),

  // delete: protectedProcedure
  //   .input(
  //     z.object({
  //       transactionId: z.string(),
  //       tagId: z.string(),
  //     }),
  //   )
  //   .mutation(async ({ ctx: { supabase }, input }) => {
  //     const { data } = await deleteTransactionTag(supabase, {
  //       transactionId: input.transactionId,
  //       tagId: input.tagId,
  //     });

  //     return data;
  //   }),
});
