"use server";

import { authActionClient } from "@/actions/safe-action";
import { revalidateTag } from "next/cache";
import { updateInvoiceSchema } from "./schema";

export const updateInvoiceAction = authActionClient
  .metadata({
    name: "update-invoice",
  })
  .schema(updateInvoiceSchema)
  .action(
    async ({ parsedInput: { id, ...input }, ctx: { user, supabase } }) => {
      const teamId = user.team_id;

      const { data } = await supabase
        .from("invoices")
        .update(input)
        .eq("id", id)
        .select("*")
        .single();

      revalidateTag(`invoice_summary_${teamId}`);
      revalidateTag(`invoices_${teamId}`);
      revalidateTag(`invoice_number_${teamId}`);

      return data;
    },
  );
