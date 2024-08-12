"use server";

import { LogEvents } from "@midday/events/events";
import { updateBankAccount } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { updateBankAccountSchema } from "./schema";

export const updateBankAccountAction = authActionClient
  .schema(updateBankAccountSchema)
  .metadata({
    name: "update-bank-account",
    track: {
      event: LogEvents.UpdateBank.name,
      channel: LogEvents.UpdateBank.channel,
    },
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    const { data } = await updateBankAccount(supabase, {
      teamId: user.team_id,
      ...params,
    });

    revalidateTag(`bank_accounts_${user.team_id}`);
    revalidateTag(`bank_accounts_currencies_${user.team_id}`);
    revalidateTag(`bank_connections_${user.team_id}`);
    revalidateTag(`transactions_${user.team_id}`);

    return data;
  });
