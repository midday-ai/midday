"use server";

import { LogEvents } from "@midday/events/events";
import { PlainClient } from "@team-plain/typescript-sdk";
import { z } from "zod";
import { authActionClient } from "./safe-action";

const client = new PlainClient({
  apiKey: process.env.PLAIN_API_KEY!,
});

export const sendFeebackAction = authActionClient
  .schema(
    z.object({
      feedback: z.string(),
    }),
  )
  .metadata({
    name: "send-feedback",
    track: {
      event: LogEvents.SendFeedback.name,
      channel: LogEvents.SendFeedback.channel,
    },
  })
  .action(async ({ parsedInput: { feedback }, ctx: { user } }) => {
    const customer = await client.upsertCustomer({
      identifier: {
        emailAddress: user.email,
      },
      onCreate: {
        fullName: user.full_name,
        externalId: user.id,
        email: {
          email: user.email,
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
      // Feedback
      labelTypeIds: ["lt_01HV93GFTZAKESXMVY8X371ADG"],
      components: [
        {
          componentText: {
            text: feedback,
          },
        },
      ],
    });

    return response;
  });
