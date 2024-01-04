"use server";

import { LogSnag } from "@logsnag/next/server";
import { getCountryCode } from "@midday/location";

const logsnag = new LogSnag({
  token: process.env.LOGSNAG_TOKEN!,
  project: process.env.LOGSNAG_PROJECT!,
});

export async function subscribeAction(formData: FormData, userGroup: string) {
  const email = formData.get("email") as string;
  const country = await getCountryCode();
  console.log("katt");
  console.log(process.env.LOGSNAG_TOKEN);
  console.log(process.env.LOGSNAG_PROJECT);

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

  logsnag.track({
    event: "User Joined Waitlist",
    notify: true,
    icon: "⭐",
    user_id: email?.toString(),
    channel: "waitlist",
    tags: {
      email,
    },
  });

  logsnag.insight.increment({
    title: "User Waitlist Count",
    value: 1,
    icon: "👨",
  });

  console.log("katt2");

  const json = await res.json();

  return json;
}
