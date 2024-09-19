"use server";

import { getMostFrequentCurrency } from "@/utils/currency";
import { LogEvents } from "@absplatform/events/events";
import { Events, client } from "@absplatform/jobs";
import { getTeamSettings } from "@absplatform/supabase/cached-queries";
import { createBankAccounts } from "@absplatform/supabase/mutations";
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
      const { data } = await getTeamSettings();

      const selectedCurrency = getMostFrequentCurrency(accounts);

      // Update team settings with base currency if not set
      if (!data?.base_currency && selectedCurrency && teamId) {
        await supabase
          .from("teams")
          .update({
            base_currency: selectedCurrency,
          })
          .eq("id", teamId);
      }

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
