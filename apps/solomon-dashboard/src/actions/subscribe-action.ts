"use server";

import { action } from "./safe-action";
import { subscribeSchema } from "./schema";

export const subscribeAction = action(
  subscribeSchema,
  async ({ email, userGroup }) => {
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
      }
    );

    const json = await res.json();

    return json;
  }
);
