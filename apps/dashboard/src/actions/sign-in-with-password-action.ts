"use server";

import { Cookies } from "@/utils/constants";
import { createClient } from "@midday/supabase/server";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const signInWithPasswordAction = actionClient
  .schema(
    z.object({
      email: z.string().email(),
      password: z.string().min(6, "Password must be at least 6 characters"),
      redirectTo: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { email, password, redirectTo } }) => {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Validate that the session was actually established
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Failed to establish session after sign in");
    }

    (await cookies()).set(Cookies.PreferredSignInProvider, "password", {
      expires: addYears(new Date(), 1),
    });

    redirect(redirectTo || "/");
  });
