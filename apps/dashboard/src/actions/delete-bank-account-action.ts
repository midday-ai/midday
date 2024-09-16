"use server";

import { LogEvents } from "@midday/events/events";
import { deleteBankAccount } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteBankAccountSchema } from "./schema";

export const deleteBankAccountAction = authActionClient
  .schema(deleteBankAccountSchema)
  .metadata({
    name: "delete-bank-account",
    track: {
      event: LogEvents.DeleteBank.name,
      channel: LogEvents.DeleteBank.channel,
    },
  })
  .action(async ({ parsedInput: { id }, ctx: { user, supabase } }) => {
    await deleteBankAccount(supabase, id);

    revalidateTag(`bank_accounts_${user.team_id}`);
    revalidateTag(`bank_accounts_currencies_${user.team_id}`);
    revalidateTag(`bank_connections_${user.team_id}`);
    revalidateTag(`transactions_${user.team_id}`);
    revalidateTag(`metrics_${user.team_id}`);
    revalidateTag(`current_burn_rate_${user.team_id}`);
    revalidateTag(`burn_rate_${user.team_id}`);
    revalidateTag(`spending_${user.team_id}`);
    revalidateTag(`insights_${user.team_id}`);
    revalidateTag(`expenses_${user.team_id}`);
  });
