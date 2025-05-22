"use server";

import { LogEvents } from "@midday/events/events";
import { PlainClient, ThreadFieldSchemaType } from "@team-plain/typescript-sdk";
import { z } from "zod";
import { authActionClient } from "./safe-action";

const client = new PlainClient({
  apiKey: process.env.PLAIN_API_KEY!,
});

const mapToPriorityNumber = (priority: string) => {
  switch (priority) {
    case "low":
      return 0;
    case "normal":
      return 1;
    case "high":
      return 2;
    case "urgent":
      return 3;
    default:
      return 1;
  }
};

export const sendSupportAction = authActionClient
  .schema(
    z.object({
      subject: z.string(),
      priority: z.string(),
      type: z.string(),
      message: z.string(),
      url: z.string().optional(),
    }),
  )
  .metadata({
    name: "send-support",
    track: {
      event: LogEvents.SupportTicket.name,
      channel: LogEvents.SupportTicket.channel,
    },
  })
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const customer = await client.upsertCustomer({
      identifier: {
        emailAddress: user.email,
      },
      onCreate: {
        fullName: user.fullName ?? "",
        externalId: user.id,
        email: {
          email: user.email!,
          isVerified: true,
        },
      },
      onUpdate: {},
    });

    const response = await client.createThread({
      title: data.subject,
      description: data.message,
      priority: mapToPriorityNumber(data.priority),
      customerIdentifier: {
        customerId: customer.data?.customer.id,
      },
      // Support
      labelTypeIds: ["lt_01HV93FQT6NSC1EN2HHA6BG9WK"],
      components: [
        {
          componentText: {
            text: data.message,
          },
        },
      ],
      threadFields: data.url
        ? [
            {
              type: ThreadFieldSchemaType.String,
              key: "url",
              stringValue: data.url,
            },
          ]
        : undefined,
    });

    return response;
  });
