"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";
import { updateBankAccount } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { updateBankAccountSchema } from "./schema";

export const updateBankAccountAction = action(
  updateBankAccountSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    await client.sendEvent({
      name: Events.TRANSACTIONS_MANUAL_SYNC,
      payload: {
        teamId: user.data.team_id,
      },
    });

    // const { data } = await updateBankAccount(supabase, {
    //   teamId: user.data.team_id,
    //   ...params,
    // });
    // // TODO: Check enabled account, if none disable job otherwise start new based on team_id
    // // and initial sync for account_id
    // revalidateTag(`bank_accounts_${data.team_id}`);
    // revalidateTag(`bank_connections_${data.team_id}`);
    // revalidateTag(`transactions_${data.team_id}`);
    // logsnag.track({
    //   event: LogEvents.DeleteBank.name,
    //   icon: LogEvents.DeleteBank.icon,
    //   user_id: data.created_by,
    //   channel: LogEvents.DeleteBank.channel,
    // });
  }
);
