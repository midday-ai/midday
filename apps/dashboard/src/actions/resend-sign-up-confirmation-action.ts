"use server";

import { getUrl } from "@/utils/environment";
import { createClient } from "@midday/supabase/server";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const resendSignUpConfirmationAction = actionClient
  .schema(
    z.object({
      email: z.string().email(),
    }),
  )
  .action(async ({ parsedInput: { email } }) => {
    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${getUrl()}/api/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: "Confirmation email sent. Check your inbox and spam folder.",
    };
  });
