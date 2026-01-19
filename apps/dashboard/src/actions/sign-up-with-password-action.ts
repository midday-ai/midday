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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getUrl()}/api/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message:
        "Check your email for a confirmation link to complete your registration.",
    };
  });
