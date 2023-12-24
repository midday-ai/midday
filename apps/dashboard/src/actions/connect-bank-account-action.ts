"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { action } from "./safe-action";
import { connectBankAccountSchema } from "./schema";

export const connectBankAccountAction = action(
  connectBankAccountSchema,
  async (value) => {
    const user = await getUser();

    return value;
  }
);
