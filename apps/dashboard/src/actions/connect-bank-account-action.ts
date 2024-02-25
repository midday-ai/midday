"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { getTransactions, transformTransactions } from "@midday/gocardless";
import { scheduler } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { action } from "./safe-action";
import { connectBankAccountSchema } from "./schema";

export const connectBankAccountAction = action(
  connectBankAccountSchema,
  async (accounts) => {
    const user = await getUser();
    // const supabase = createClient();
    // const teamId = user.data.team_id;

    logsnag.track({
      event: LogEvents.ConnectBankCompleted.name,
      icon: LogEvents.ConnectBankCompleted.icon,
      user_id: user.data.email,
      channel: LogEvents.ConnectBankCompleted.channel,
    });

    return;
  }
);
