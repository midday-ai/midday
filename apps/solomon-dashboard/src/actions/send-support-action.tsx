"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { PlainClient } from "@team-plain/typescript-sdk";
import { action } from "./safe-action";
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

export const sendSupportAction = action(sendSupportSchema, async (data) => {
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

  const analytics = await setupAnalytics({
    userId: user.data.id,
    fullName: user.data.full_name,
  });

  analytics.track({
    event: LogEvents.SupportTicket.name,
    channel: LogEvents.SupportTicket.channel,
  });

  return response;
});
