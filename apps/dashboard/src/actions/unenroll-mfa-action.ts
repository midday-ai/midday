"use server";

import { createClient } from "@midday/supabase/server";
import { revalidatePath } from "next/cache";
import { action } from "./safe-action";
import { unenrollMfaSchema } from "./schema";

export const unenrollMfaAction = action(
  unenrollMfaSchema,
  async ({ factoryId }) => {
    const supabase = createClient();

    const { data, error } = await supabase.auth.mfa.unenroll({
      factoryId,
    });

    if (error) {
      throw Error(error.message);
    }

    revalidatePath("/settings/security");

    return data;
  }
);
