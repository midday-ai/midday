"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { updateBankAccount } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { updateBankAccountSchema } from "./schema";

export const updateBankAccountAction = action(
  updateBankAccountSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    const { data } = await updateBankAccount(supabase, {
      teamId: user.data.team_id,
      ...params,
    });

    revalidateTag(`bank_accounts_${data.team_id}`);
    revalidateTag(`bank_accounts_currencies_${data.team_id}`);
    revalidateTag(`bank_connections_${data.team_id}`);
    revalidateTag(`transactions_${data.team_id}`);

    const analytics = await setupAnalytics({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    analytics.track({
      event: LogEvents.DeleteBank.name,
      channel: LogEvents.DeleteBank.channel,
    });
  }
);
