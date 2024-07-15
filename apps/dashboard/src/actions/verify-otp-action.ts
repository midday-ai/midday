"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { actionClient } from "./safe-action";
import { verifyOtpSchema } from "./schema";

export const verifyOtpAction = actionClient
  .schema(verifyOtpSchema)
  .action(
    async ({
      parsedInput: { email, phone, token, type },
      ctx: { supabase },
    }) => {
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
    },
  );
