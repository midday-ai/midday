"use server";

import { PlainClient } from "@team-plain/typescript-sdk";
import { actionClient } from "./safe-action";
import { sendSupportSchema } from "./schema";

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

export const sendSupportAction = actionClient
  .schema(sendSupportSchema)
  .action(async ({ parsedInput: data }) => {
    const customer = await client.upsertCustomer({
      identifier: {
        emailAddress: data.email,
      },
      onCreate: {
        fullName: data.fullName,
        email: {
          email: data.email,
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
    });

    return response;
  });
