"use server";

import { getAuth } from "@midday/auth/server";
import { isLocalBackend } from "@midday/utils/backend";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const unenrollMfaAction = authActionClient
  .schema(z.object({ factorId: z.string().optional() }))
  .metadata({ name: "unenroll-mfa" })
  .action(async ({ parsedInput: { factorId }, ctx: { supabase } }) => {
    if (!isLocalBackend()) {
      if (!supabase || !factorId) throw new Error("Missing Supabase factor");
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw new Error(error.message);
      revalidatePath("/account/security");
      return { disabled: true };
    }
    const auth = await getAuth();
    await auth.api.disableTwoFactor({ body: {}, headers: await headers() });
    revalidatePath("/account/security");
    return { disabled: true };
  });
