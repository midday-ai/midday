"use server";

import { LogSnag } from "@logsnag/next/server";
import { getCountryCode } from "@midday/location";

export async function subscribeEmail(formData: FormData, userGroup: string) {
  const email = formData.get("email");
  const country = await getCountryCode();

  const res = await fetch(
    "https://app.loops.so/api/newsletter-form/clna1p09j00d3l60og56gj3u1",
    {
      cache: "no-cache",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        userGroup,
        country,
      }),
    }
  );

  const json = await res.json();

  return json;
}
