"use server";

import { getUrl } from "@/utils/environment";
import { createClient } from "@midday/supabase/server";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const resetPasswordAction = actionClient
  .schema(
    z.object({
      email: z.string().email(),
    }),
  )
  .action(async ({ parsedInput: { email } }) => {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getUrl()}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: "Check your email for a password reset link.",
    };
  });
