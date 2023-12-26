"use server";

import { Events, client } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";
import { createBankAccounts } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { connectBankAccountSchema } from "./schema";

export const connectBankAccountAction = action(
  connectBankAccountSchema,
  async ({ accounts }) => {
    const user = await getUser();
    const supabase = createClient();
    const teamId = user.data.team_id;

    const { data } = await createBankAccounts(supabase, accounts);

    // const event = await client.sendEvent({
    //   name: Events.TRANSACTIONS_INITIAL_SYNC,
    //   payload: {
    //     id,
    //     accountId,
    //     teamId,
    //   },
    // });

    revalidateTag(`bank_connections_${teamId}`);

    return {
      event,
      data,
    };
  }
);
