"use server";

import { LogEvents } from "@midday/events/events";
import { updateTeam } from "@midday/supabase/mutations";
import { updateBaseCurrency } from "jobs/tasks/transactions/update-base-currency";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const updateCurrencyAction = authActionClient
  .schema(
    z.object({
      baseCurrency: z.string(),
    }),
  )
  .metadata({
    name: "update-currency",
    track: {
      event: LogEvents.UpdateCurrency.name,
      channel: LogEvents.UpdateCurrency.channel,
    },
  })
  .action(
    async ({ parsedInput: { baseCurrency }, ctx: { user, supabase } }) => {
      if (!user.team_id) {
        throw new Error("No team id");
      }

      await updateTeam(supabase, {
        id: user.team_id,
        base_currency: baseCurrency,
      });

      revalidateTag(`team_settings_${user.team_id}`);
      revalidatePath("/settings/accounts");

      const event = await updateBaseCurrency.trigger({
        teamId: user.team_id,
        baseCurrency,
      });

      return event;
    },
  );
