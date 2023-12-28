"use server";

import { Events, client } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";
import { action } from "./safe-action";
import { exportTransactionsSchema } from "./schema";

export const exportTransactionsAction = action(
  exportTransactionsSchema,
  async ({ from, to }) => {
    const user = await getUser();

    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_EXPORT,
      payload: {
        from,
        to,
        teamId: user.data.team_id,
        locale: user.data.locale,
      },
    });

    return event;
  }
);
