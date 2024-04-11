"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
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
    priority: mapToPriorityNumber(data.priority),
    customerIdentifier: {
      customerId: customer.data?.customer.id,
    },
    components: [
      {
        componentText: {
          text: data.message,
        },
      },
    ],
  });

  const logsnag = setupLogSnag({
    userId: user.data.id,
    fullName: user.data.full_name,
  });

  logsnag.track({
    event: LogEvents.SupportTicket.name,
    icon: LogEvents.SupportTicket.icon,
    channel: LogEvents.SupportTicket.channel,
  });

  return response;
});
