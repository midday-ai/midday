import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

export const transactionsRouter = createTRPCRouter({
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // return updateTransaction({ id: ctx.authenticatedId, ...input });
    }),
});
