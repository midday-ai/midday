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

    try {
      const { data } = await createBankAccounts(
        supabase,
        accounts.map((account) => ({
          ...account,
          provider,
        }))
      );

      // const event = await client.sendEvent({
      //   name: Events.TRANSACTIONS_SETUP_V2,
      //   payload: {
      //     teamId: user.data.team_id,
      //     provider,
      //     accounts: data.map((account) => ({
      //       id: account.id,
      //       account_id: account.account_id,
      //     })),
      //   },
      // });

      logsnag.track({
        event: LogEvents.ConnectBankCompleted.name,
        icon: LogEvents.ConnectBankCompleted.icon,
        user_id: user.data.email,
        channel: LogEvents.ConnectBankCompleted.channel,
        tags: {
          provider,
        },
      });

      return event;
    } catch (err) {
      console.log(err);

      logsnag.track({
        event: LogEvents.ConnectBankFailed.name,
        icon: LogEvents.ConnectBankFailed.icon,
        user_id: user.data.email,
        channel: LogEvents.ConnectBankFailed.channel,
        tags: {
          provider,
        },
      });

      throw new Error("Something went wrong");
    }
  }
);
