"use server";

import { createClient } from "@midday/supabase/server";
import { addYears } from "date-fns";
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

    (await cookies()).set(Cookies.PreferredSignInProvider, "otp", {
      expires: addYears(new Date(), 1),
    });

    redirect(redirectTo);
  });
