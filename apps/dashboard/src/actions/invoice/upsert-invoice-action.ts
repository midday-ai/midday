"use server";

import { authActionClient } from "@/actions/safe-action";
import { revalidateTag } from "next/cache";
import { upsertInvoiceSchema } from "./schema";

export const upsertInvoiceAction = authActionClient
  .metadata({
    name: "upsert-invoice",
  })
  .schema(upsertInvoiceSchema)
  .action(
    async ({
      parsedInput: { id, template, ...input },
      ctx: { user, supabase },
    }) => {
      const teamId = user.team_id;
      let data;

      if (id) {
        const { data: invoice } = await supabase
          .from("invoices")
          .update({
            team_id: teamId,
          })
          .select("*")
          .single();

        data = invoice;
      } else {
        const { data: invoice } = await supabase
          .from("invoices")
          .insert({
            team_id: teamId,
          })
          .select("*")
          .single();

        data = invoice;
      }

      console.log(input, template, data);

      revalidateTag(`invoice_summary_${teamId}`);
      revalidateTag(`invoices_${teamId}`);

      return data;
    },
  );
