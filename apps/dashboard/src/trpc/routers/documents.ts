import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getDocumentQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const documentsRouter = createTRPCRouter({
  getByPath: protectedProcedure
    .input(z.object({ filePath: z.string() }))
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await getDocumentQuery(supabase, {
        filePath: input.filePath,
        teamId: teamId!,
      });

      return data;
    }),
});
