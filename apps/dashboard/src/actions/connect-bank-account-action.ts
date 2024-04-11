"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";
import { createBankAccounts } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { connectBankAccountSchema } from "./schema";

export const connectBankAccountAction = action(
  connectBankAccountSchema,
  async ({ provider, accounts, accessToken, enrollmentId }) => {
    const user = await getUser();
    const teamId = user.data.team_id;
    const supabase = createClient();

    const logsnag = setupLogSnag({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    try {
      await createBankAccounts(supabase, {
        accessToken,
        enrollmentId,
        teamId,
        userId: user.data.id,
        accounts,
        provider,
      });
    } catch (error) {
      console.log(error);

      logsnag.track({
        event: LogEvents.ConnectBankFailed.name,
        icon: LogEvents.ConnectBankFailed.icon,
        channel: LogEvents.ConnectBankFailed.channel,
        tags: {
          provider,
        },
      });

      throw new Error("Something went wrong");
    }

    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_INITIAL_SYNC,
      payload: {
        teamId,
      },
    });

    logsnag.track({
      event: LogEvents.ConnectBankCompleted.name,
      icon: LogEvents.ConnectBankCompleted.icon,
      channel: LogEvents.ConnectBankCompleted.channel,
      tags: {
        provider,
      },
    });

    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`bank_connections_${teamId}`);

    return event;
  }
);
