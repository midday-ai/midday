"use server";

import { resend } from "@/utils/resend";
import { authActionClient } from "./safe-action";
import { subscribeSchema } from "./schema";

export const subscribeAction = authActionClient
  .schema(subscribeSchema)
  .metadata({
    name: "subscribe",
  })
  .action(async ({ parsedInput: { email } }) => {
    return resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    });
  });
