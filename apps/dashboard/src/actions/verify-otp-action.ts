"use server";

import { createClient } from "@midday/supabase/server";
import { addSeconds, addYears } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Cookies } from "@/utils/constants";
import { actionClient } from "./safe-action";

export const verifyOtpAction = actionClient
  .schema(
    z.object({
      token: z.string(),
      email: z.string(),
      redirectTo: z.string(),
    }),
  )
  .action(async ({ parsedInput: { email, token, redirectTo } }) => {
    const supabase = await createClient();

    await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    // Validate that the session was actually established (similar to OAuth callback)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Failed to establish session after OTP verification");
    }

    const cookieStore = await cookies();

    cookieStore.set(Cookies.PreferredSignInProvider, "otp", {
      expires: addYears(new Date(), 1),
    });

    // Force primary database reads for subsequent requests after redirect.
    // This prevents replication lag issues when the user record hasn't
    // replicated to read replicas yet (same as the OAuth callback).
    cookieStore.set(Cookies.ForcePrimary, "true", {
      expires: addSeconds(new Date(), 30),
      httpOnly: false, // Needs to be readable by client-side tRPC
      sameSite: "lax",
    });

    redirect(redirectTo);
  });
