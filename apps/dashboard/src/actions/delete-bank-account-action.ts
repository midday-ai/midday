"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { deleteBankAccount } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteBankAccountSchema } from "./schema";

export const deleteBankAccountAction = action(
  deleteBankAccountSchema,
  async ({ id }) => {
    const supabase = createClient();
    const { data } = await deleteBankAccount(supabase, id);

    revalidateTag(`bank_accounts_${data.team_id}`);
    revalidateTag(`bank_accounts_currencies_${data.team_id}`);
    revalidateTag(`bank_connections_${data.team_id}`);
    revalidateTag(`transactions_${data.team_id}`);
    revalidateTag(`metrics_${data.team_id}`);
    revalidateTag(`current_burn_rate_${data.team_id}`);
    revalidateTag(`burn_rate_${data.team_id}`);
    revalidateTag(`spending_${data.team_id}`);
    revalidateTag(`insights_${data.team_id}`);

    const analytics = await setupAnalytics({
      userId: data.created_by,
    });

    analytics.track({
      event: LogEvents.DeleteBank.name,
      channel: LogEvents.DeleteBank.channel,
    });
  }
);
