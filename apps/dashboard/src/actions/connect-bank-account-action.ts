"use server";

import { getMostFrequentCurrency } from "@/utils/currency";
import { LogEvents } from "@midday/events/events";
import { Events, client } from "@midday/jobs";
import { getTeamSettings } from "@midday/supabase/cached-queries";
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
      console.log("Starting connectBankAccountAction", {
        userId: user.id,
        teamId: user.team_id,
        provider,
      });

      const teamId = user.team_id;
      const { data, error: teamSettingsError } = await getTeamSettings();

      if (teamSettingsError) {
        console.error("Failed to fetch team settings", {
          error: teamSettingsError,
          teamId,
        });
        throw new Error("Failed to fetch team settings");
      }

      console.log("Fetched team settings", {
        teamId,
        baseCurrency: data?.base_currency,
      });

      const selectedCurrency = getMostFrequentCurrency(accounts);
      console.log("Selected currency", {
        selectedCurrency,
        accountCount: accounts.length,
      });

      // Update team settings with base currency if not set
      if (!data?.base_currency && selectedCurrency && teamId) {
        console.log("Updating team base currency", {
          teamId,
          newBaseCurrency: selectedCurrency,
        });
        const { error: updateError } = await supabase
          .from("teams")
          .update({
            base_currency: selectedCurrency,
          })
          .eq("id", teamId);

        if (updateError) {
          console.error("Failed to update team base currency", {
            error: updateError,
            teamId,
          });
        }
      }

      console.log("Creating bank accounts", {
        teamId,
        accountCount: accounts.length,
      });
      const { data: createdBankAccounts, error } = await createBankAccounts(
        supabase,
        {
          accessToken: accessToken ?? undefined,
          enrollmentId: enrollmentId ?? undefined,
          referenceId: referenceId ?? undefined,
          teamId: teamId!,
          userId: user.id,
          accounts: accounts,
          provider,
        },
      );

      if (error) {
        console.error("Failed to create bank accounts", { error, teamId });
        throw new Error("Failed to create bank accounts");
      }

      console.log("Bank accounts created successfully", {
        createdCount: createdBankAccounts?.length ?? 0,
      });

      console.log("Sending event to sync transactions", { teamId });
      const event = await client.sendEvent({
        name: Events.TRANSACTIONS_INITIAL_SYNC,
        payload: {
          teamId,
        },
      });

      console.log("Transaction sync event sent", { eventId: event.id });

      console.log("Revalidating cache tags");
      revalidateTag(`bank_accounts_${teamId}`);
      revalidateTag(`bank_accounts_currencies_${teamId}`);
      revalidateTag(`bank_connections_${teamId}`);

      console.log("connectBankAccountAction completed successfully", {
        teamId,
      });
      return event;
    },
  );
