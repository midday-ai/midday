"use server";

import { getMostFrequentCurrency } from "@/utils/currency";
import { LogEvents } from "@midday/events/events";
import { getTeamSettings } from "@midday/supabase/cached-queries";
import { createBankConnection } from "@midday/supabase/mutations";
import { initialBankSetup } from "jobs/tasks/bank/setup/initial";
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

      if (!teamId) {
        throw new Error("Team ID is required");
      }

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

      const { data: bankConnection } = await createBankConnection(supabase, {
        accessToken,
        enrollmentId,
        referenceId,
        teamId,
        userId: user.id,
        accounts,
        provider,
      });

      const event = await initialBankSetup.trigger({
        teamId,
        connectionId: bankConnection?.id,
      });

      revalidateTag(`bank_accounts_${teamId}`);
      revalidateTag(`bank_accounts_currencies_${teamId}`);
      revalidateTag(`bank_connections_${teamId}`);

      return event;
    },
  );
