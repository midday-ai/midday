"use server";

import { Cookies } from "@/utils/constants";
import { createClient } from "@midday/supabase/server";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
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

    (await cookies()).set(Cookies.PreferredSignInProvider, "otp", {
      expires: addYears(new Date(), 1),
    });

    redirect(redirectTo);
  });
