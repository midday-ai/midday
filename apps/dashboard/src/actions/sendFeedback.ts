"use server";

import { env } from "@/env.mjs";

const baseUrl = "https://api.resend.com";

export async function sendFeeback(formData: FormData) {
  const feedback = formData.get("feedback");

  const res = await fetch(`${baseUrl}/email`, {
    method: "post",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "feedback@midday.ai",
      to: "pontus@lostisland.co",
      subject: "Feedback",
      text: feedback,
    }),
  });

  const json = await res.json();
  console.log(json);
  return json;
}
