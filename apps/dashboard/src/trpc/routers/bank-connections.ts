import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";

export const bankConnectionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return [];
    }),
});
