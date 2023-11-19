"use server";

import { client } from "@/trigger";
import { getUser } from "@midday/supabase/cached-queries";
import { action } from "./safe-action";
import { exportTransactionsSchema } from "./schema";

export const exportTransactionsAction = action(
  exportTransactionsSchema,
  async ({ from, to }) => {
    const user = await getUser();

    const event = await client.sendEvent({
      name: "transactions.export",
      payload: {
        from,
        to,
        teamId: user.data.team_id,
      },
    });

    console.log(event);
  }
);
