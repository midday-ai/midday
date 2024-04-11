"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { PlainClient } from "@team-plain/typescript-sdk";
import { action } from "./safe-action";
import { sendFeedbackSchema } from "./schema";

const client = new PlainClient({
  apiKey: process.env.PLAIN_API_KEY!,
});

export const sendFeebackAction = action(
  sendFeedbackSchema,
  async ({ feedback }) => {
    const user = await getUser();

    const customer = await client.upsertCustomer({
      identifier: {
        emailAddress: user.data.email,
      },
      onCreate: {
        fullName: user.data.full_name,
        externalId: user.data.id,
        email: {
          email: user.data.email,
          isVerified: true,
        },
      },
      onUpdate: {},
    });

    const response = await client.createThread({
      title: "Feedback",
      customerIdentifier: {
        customerId: customer.data?.customer.id,
      },
      components: [
        {
          componentText: {
            text: feedback,
          },
        },
      ],
    });

    const logsnag = setupLogSnag({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    logsnag.track({
      event: LogEvents.SendFeedback.name,
      icon: LogEvents.SendFeedback.icon,
      channel: LogEvents.SendFeedback.channel,
    });

    return response;
  }
);
