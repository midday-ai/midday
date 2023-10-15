"use server";

import { env } from "@/env.mjs";
import { getSupabaseServerActionClient } from "@midday/supabase/action-client";

const baseUrl = "https://api.resend.com";

export async function sendFeeback(formData: FormData) {
  const supabase = await getSupabaseServerActionClient();
  const feedback = formData.get("feedback");
  const { data } = await supabase.auth.getSession();

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
      text: `${feedback} \nName: ${data?.data_metadata?.name} \nEmail: ${data?.email}`,
    }),
  });

  const json = await res.json();

  return json;
}
