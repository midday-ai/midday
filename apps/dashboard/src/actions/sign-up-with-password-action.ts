"use server";

import { getUrl } from "@/utils/environment";
import { createClient } from "@midday/supabase/server";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const signUpWithPasswordAction = actionClient
  .schema(
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      }),
  )
  .action(async ({ parsedInput: { email, password } }) => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getUrl()}/api/auth/callback`,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (message.includes("already registered")) {
        return {
          success: true,
          status: "account_exists" as const,
          message:
            "If an account already exists for this email, sign in or reset your password.",
        };
      }

      throw new Error(error.message);
    }

    const hasSession = Boolean(data.session);
    const hasIdentities = (data.user?.identities?.length ?? 0) > 0;

    // Supabase may return a user with no identities for existing addresses when confirmations are enabled.
    if (!hasSession && !hasIdentities) {
      return {
        success: true,
        status: "account_exists" as const,
        message:
          "If an account already exists for this email, sign in or reset your password.",
      };
    }

    if (hasSession) {
      return {
        success: true,
        status: "ready_to_sign_in" as const,
        message: "Account created. You can sign in now.",
      };
    }

    return {
      success: true,
      status: "confirmation_required" as const,
      message:
        "Check your email for a confirmation link to complete your registration.",
    };
  });
