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
      parsedInput: { id, template, token: draftToken, ...input },
      ctx: { user, supabase },
    }) => {
      const teamId = user.team_id;

      // Only generate token if it's not provided, ie. when the invoice is created
      const token = draftToken ?? (await generateToken(id));

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
