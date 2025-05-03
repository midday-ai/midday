"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const unenrollMfaAction = authActionClient
  .schema(
    z.object({
      factorId: z.string(),
    }),
  )
  .metadata({
    name: "unenroll-mfa",
  })
  .action(async ({ parsedInput: { factorId }, ctx: { supabase } }) => {
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId,
      issuer: "app.midday.ai",
    });

    if (error) {
      throw Error(error.message);
    }

    revalidatePath("/account/security");

    return data;
  });
