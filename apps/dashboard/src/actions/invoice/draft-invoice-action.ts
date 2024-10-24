"use server";

import { authActionClient } from "@/actions/safe-action";
import { generateToken } from "@midday/invoice/token";
import { revalidateTag } from "next/cache";
import { draftInvoiceSchema } from "./schema";

export const draftInvoiceAction = authActionClient
  .metadata({
    name: "draft-invoice",
  })
  .schema(draftInvoiceSchema)
  .action(
    async ({
      parsedInput: { id, template, ...input },
      ctx: { user, supabase },
    }) => {
      const teamId = user.team_id;

      // Generate token if customer_id is not provided because it's a new invoice
      // We use upsert so we don't have to check if the invoice already exists
      const token = !input.customer_id && (await generateToken(id));

      const { payment_details, from_details, ...restTemplate } = template;

      const { data } = await supabase
        .from("invoices")
        .upsert(
          {
            id,
            team_id: teamId,
            currency: template.currency,
            payment_details,
            from_details,
            template: restTemplate,
            token,
            ...input,
          },
          {
            onConflict: "id",
            merge: true,
          },
        )
        .select("*")
        .single();

      revalidateTag(`invoice_summary_${teamId}`);
      revalidateTag(`invoices_${teamId}`);
      revalidateTag(`invoice_number_${teamId}`);

      return data;
    },
  );
