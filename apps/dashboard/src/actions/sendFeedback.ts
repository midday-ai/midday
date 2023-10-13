"use server";

import { env } from "@/env.mjs";
import { getSession } from "@midday/supabase/server";

const baseUrl = "https://api.resend.com";

export async function sendFeeback(formData: FormData) {
  const feedback = formData.get("feedback");
  const { user } = await getSession();

  const res = await fetch(`${baseUrl}/email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "feedback@midday.ai",
      to: "pontus@lostisland.co",
      subject: "Feedback",
      text: `${feedback} \nName: ${user?.user_metadata?.name} \nEmail: ${user?.email}`,
    }),
  });

  const json = await res.json();

  return json;
}
