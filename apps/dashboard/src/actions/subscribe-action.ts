"use server";

import { authActionClient } from "./safe-action";
import { subscribeSchema } from "./schema";

export const subscribeAction = authActionClient
  .schema(subscribeSchema)
  .metadata({
    name: "subscribe",
  })
  .action(async ({ parsedInput: { email, userGroup } }) => {
    const res = await fetch(
      "https://app.loops.so/api/newsletter-form/clna1p09j00d3l60og56gj3u1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          userGroup,
        }),
      },
    );

    return res.json();
  });
