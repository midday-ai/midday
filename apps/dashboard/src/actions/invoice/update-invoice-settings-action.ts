"use server";

import { authActionClient } from "@/actions/safe-action";
import { revalidateTag } from "next/cache";
import { updateInvoiceSettingsSchema } from "./schema";

export const updateInvoiceSettingsAction = authActionClient
  .metadata({
    name: "update-invoice-settings",
  })
  .schema(updateInvoiceSettingsSchema)
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
