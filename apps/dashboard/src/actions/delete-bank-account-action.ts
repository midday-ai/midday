"use server";

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
    revalidateTag(`bank_connections_${data.team_id}`);
  }
);
