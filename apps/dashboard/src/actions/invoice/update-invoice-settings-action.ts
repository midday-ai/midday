"use server";

import { authActionClient } from "@/actions/safe-action";
import { updateInvoiceSettingsSchema } from "./schema";

export const updateInvoiceSettingsAction = authActionClient
  .metadata({
    name: "update-invoice-settings",
  })
  .schema(updateInvoiceSettingsSchema)
  .action(async ({ parsedInput: setting, ctx: { user, supabase } }) => {
    const teamId = user.team_id;

    const { data, error } = await supabase
      .rpc("update_team_setting", {
        team_id: teamId,
        setting_key: "invoice",
        setting_path: [setting],
        new_value: setting,
        create_missing: true,
      })
      .select("*")
      .single();

    console.log(data, error);

    return data;
  });
