"use server";

import { Cookies } from "@/utils/constants";
import { createClient } from "@midday/supabase/server";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const updatePasswordAction = actionClient
  .schema(
    z
      .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      }),
  )
  .action(async ({ parsedInput: { password } }) => {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Set preferred provider to password after successful reset
    (await cookies()).set(Cookies.PreferredSignInProvider, "password", {
      expires: addYears(new Date(), 1),
    });

    redirect("/");
  });
