"use server";

import { Cookies } from "@/utils/constants";
import { createClient } from "@midday/supabase/server";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { action } from "./safe-action";
import { verifyOtpSchema } from "./schema";

export const verifyOtpAction = action(
  verifyOtpSchema,
  async ({ email, phone, token, type }) => {
    const supabase = createClient();

    const options =
      type === "email"
        ? {
            email,
            token,
            type: "email",
          }
        : {
            phone,
            token,
            type: "sms",
          };

    await supabase.auth.verifyOtp(options);

    cookies().set(Cookies.PreferredSignInProvider, "otp", {
      expires: addYears(new Date(), 1),
    });

    redirect("/");
  }
);
