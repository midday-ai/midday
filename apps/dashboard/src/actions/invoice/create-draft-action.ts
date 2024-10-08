"use server";

import { authActionClient } from "@/actions/safe-action";
import { revalidatePath, revalidateTag } from "next/cache";

export const createInvoiceDraftAction = authActionClient
  .metadata({
    name: "create-invoice-draft",
  })
  .action(async ({ ctx: { user, supabase } }) => {
    const teamId = user.team_id;

    const { data } = await supabase
      .from("invoices")
      .insert({
        team_id: teamId,
      })
      .select("*")
      .single();

    revalidatePath("/invoices");
    revalidateTag(`invoice_summary_${teamId}`);

    return data;
  });
