"use server";

import { authActionClient } from "@/actions/safe-action";
import { revalidateTag } from "next/cache";
import { updateInvoiceTemplateSchema } from "./schema";

export const updateInvoiceTemplateAction = authActionClient
  .metadata({
    name: "update-invoice-template",
  })
  .schema(updateInvoiceTemplateSchema)
  .action(async ({ parsedInput: setting, ctx: { user, supabase } }) => {
    const teamId = user.team_id;

    const { data, error } = await supabase
      .from("invoice_templates")
      .upsert({ team_id: teamId, ...setting }, { onConflict: "team_id" })
      .eq("team_id", teamId)
      .select()
      .single();

    revalidateTag(`invoice_templates_${teamId}`);

    return data;
  });
