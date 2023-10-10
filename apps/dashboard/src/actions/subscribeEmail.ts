"use server";

import { env } from "@/env.mjs";

export async function subscribeEmail(formData: FormData, userGroup: string) {
  const email = formData.get("email");

  const res = await fetch(env.LOOPS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, userGroup }),
  });

  const json = await res.json();

  return json;
}
