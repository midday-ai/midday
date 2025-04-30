import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import type { deleteConnection } from "@midday/jobs/tasks/bank/delete/delete-connection";
import { deleteBankConnection } from "@midday/supabase/mutations";
import { getBankConnectionsQuery } from "@midday/supabase/queries";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const bankConnectionsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getBankConnectionsQuery(supabase, {
      teamId: teamId!,
    });

    return data;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteBankConnection(supabase, {
        id: input.id,
      });

      if (!data) {
        throw new Error("Bank connection not found");
      }

      await tasks.trigger<typeof deleteConnection>("delete-connection", {
        referenceId: data.reference_id,
        provider: data.provider!,
        accessToken: data.access_token,
      });

      return data;
    }),
});
