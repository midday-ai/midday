"use server";

import { Cookies } from "@/utils/constants";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authActionClient } from "./safe-action";
import { verifyOtpSchema } from "./schema";

export const verifyOtpAction = authActionClient
  .schema(verifyOtpSchema)
  .metadata({
    name: "update-user",
  })
  .action(
    async ({
      parsedInput: { type, email, token, phone },
      ctx: { user, supabase },
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
