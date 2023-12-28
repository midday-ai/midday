"use server";

import { env } from "@/env.mjs";
import { createClient } from "@midday/supabase/server";
import { action } from "./safe-action";
import { sendFeedbackSchema } from "./schema";

const baseUrl = "https://api.resend.com";

export const sendFeebackAction = action(
  sendFeedbackSchema,
  async ({ feedback }) => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(`${baseUrl}/email`, {
      method: "POST",
      cache: "no-cache",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "feedback@midday.ai",
        to: "pontus@lostisland.co",
        subject: "Feedback",
        text: `${feedback} \nName: ${session?.user?.user_metadata?.name} \nEmail: ${session?.user?.email}`,
      }),
    });

    const json = await res.json();

    return json;
  }
);
