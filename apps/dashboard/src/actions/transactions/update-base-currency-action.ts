"use server";

import { LogEvents } from "@midday/events/events";
import { Events, client } from "@midday/jobs";
import { updateTeam } from "@midday/supabase/mutations";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const updateBaseCurrencyAction = authActionClient
  .schema(
    z.object({
      currency: z.string(),
    }),
  )
  .metadata({
    name: "update-base-currency",
    track: {
      event: LogEvents.UpdateBaseCurrency.name,
      channel: LogEvents.UpdateBaseCurrency.channel,
    },
  })
  .action(async ({ parsedInput: { currency }, ctx: { user, supabase } }) => {
    await updateTeam(supabase, {
      id: user.team_id,
      base_currency: currency,
    });

    revalidateTag(`user_${user.id}`);
    revalidatePath("/settings/accounts");

    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_UPDATE_BASE_CURRENCY,
      payload: {
        currency,
        teamId: user.team_id,
      },
    });

    return event;
  });
