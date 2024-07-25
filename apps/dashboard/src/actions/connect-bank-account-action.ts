"use server";

import { LogEvents } from "@midday/events/events";
import { Events, client } from "@midday/jobs";
import { createBankAccounts } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { connectBankAccountSchema } from "./schema";

export const connectBankAccountAction = authActionClient
  .schema(connectBankAccountSchema)
  .metadata({
    name: "connect-bank-account",
    track: {
      event: LogEvents.ConnectBankCompleted.name,
      channel: LogEvents.ConnectBankCompleted.channel,
    },
  })
  .action(
    async ({
      parsedInput: {
        provider,
        accounts,
        accessToken,
        enrollmentId,
        referenceId,
      },
      ctx: { supabase, user },
    }) => {
      const teamId = user.team_id;

      await createBankAccounts(supabase, {
        accessToken,
        enrollmentId,
        referenceId,
        teamId,
        userId: user.id,
        accounts,
        provider,
      });

      const event = await client.sendEvent({
        name: Events.TRANSACTIONS_INITIAL_SYNC,
        payload: {
          teamId,
        },
      });

      revalidateTag(`bank_accounts_${teamId}`);
      revalidateTag(`bank_accounts_currencies_${teamId}`);
      revalidateTag(`bank_connections_${teamId}`);

      return event;
    },
  );
