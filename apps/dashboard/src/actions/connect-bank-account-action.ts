"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";
import { createBankAccounts } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { action } from "./safe-action";
import { connectBankAccountSchema } from "./schema";

export const connectBankAccountAction = action(
  connectBankAccountSchema,
  async ({ provider, accounts }) => {
    const user = await getUser();
    const supabase = createClient();

    const { data } = await createBankAccounts(supabase, accounts);

    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_SETUP,
      payload: {
        teamId: user.data.team_id,
        provider,
        accounts: data.map((account) => ({
          id: account.id,
          account_id: account.account_id,
        })),
      },
    });

    logsnag.track({
      event: LogEvents.ConnectBankCompleted.name,
      icon: LogEvents.ConnectBankCompleted.icon,
      user_id: user.data.email,
      channel: LogEvents.ConnectBankCompleted.channel,
    });

    // {
    //     id: '01HQGPMKCSSBMN0DEFS7DBRD1M',
    //     name: 'transactions.setup',
    //     payload: {
    //       teamId: 'dd6a039e-d071-423a-9a4d-9ba71325d890',
    //       provider: 'gocardless',
    //       accounts: [ [Object] ]
    //     },
    //     timestamp: 2024-02-25T17:57:36.793Z
    //   }

    return event;
  }
);
