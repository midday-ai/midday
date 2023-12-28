"use server";

import { createClient } from "@midday/supabase/server";
import { revalidatePath } from "next/cache";
import { action } from "./safe-action";
import { mfaVerifySchema } from "./schema";

export const mfaVerifyAction = action(
  mfaVerifySchema,
  async ({ factorId, challengeId, code }) => {
    const supabase = createClient();

    const { data } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    revalidatePath("/account/security");

    return data;
  }
);
