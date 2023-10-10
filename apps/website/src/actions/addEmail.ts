"use server";

import { track } from "@vercel/analytics/server";

export async function addEmail(formData: FormData) {
  const email = formData.get("email");

  const res = await fetch(
    "https://app.loops.so/api/newsletter-form/clna1p09j00d3l60og56gj3u1",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, userGroup: "pre-launch" }),
    },
  );

  const json = await res.json();

  if (email) {
    track("Subscribe", { email: email?.toString() });
  }

  return json;
}
