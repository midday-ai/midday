"use server";

import { authActionClient } from "@/actions/safe-action";
import { parseInputValue } from "@/components/invoice/utils";
import { revalidateTag } from "next/cache";
import { updateInvoiceTemplateSchema } from "./schema";

export const updateInvoiceTemplateAction = authActionClient
  .metadata({
    name: "update-invoice-template",
  })
  .schema(updateInvoiceTemplateSchema)
  .action(
    async ({
      parsedInput: { from_details, payment_details, ...rest },
      ctx: { user, supabase },
    }) => {
      const teamId = user.team_id;

      const { data } = await supabase
        .from("invoice_templates")
        .upsert(
          {
            team_id: teamId,
            from_details: parseInputValue(from_details),
            payment_details: parseInputValue(payment_details),
            ...rest,
          },
          { onConflict: "team_id" },
        )
        .eq("team_id", teamId)
        .select()
        .single();

      revalidateTag(`invoice_templates_${teamId}`);

      return data;
    },
  );
