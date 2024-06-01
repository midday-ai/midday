"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
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

    const analytics = await setupAnalytics({
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

      analytics.track({
        event: LogEvents.ConnectBankFailed.name,
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

    analytics.track({
      event: LogEvents.ConnectBankCompleted.name,
      channel: LogEvents.ConnectBankCompleted.channel,
      tags: {
        provider,
      },
    });

    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`bank_accounts_currencies_${teamId}`);
    revalidateTag(`bank_connections_${teamId}`);

    return event;
  }
);
