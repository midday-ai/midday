"use server";

import { authActionClient } from "@/actions/safe-action";
import { createInvoiceSchema } from "./schema";

export const createInvoiceAction = authActionClient
  .metadata({
    name: "create-invoice",
  })
  .schema(createInvoiceSchema)
  .action(
    async ({
      parsedInput: { settings, ...input },
      ctx: { user, supabase },
    }) => {
      const teamId = user.team_id;

      console.log(input, settings);

      //   const { data } = await supabase
      //     .from("invoices")
      //     .insert({
      //       team_id: teamId,
      //     })
      //     .select("*")
      //     .single();

      //   revalidateTag(`invoice_summary_${teamId}`);
      //   revalidateTag(`invoices_${teamId}`);

      //   return data;
    },
  );
