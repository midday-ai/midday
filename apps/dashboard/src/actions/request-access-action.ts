"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { PlainClient } from "@team-plain/typescript-sdk";
import { action } from "./safe-action";
import { requestAccessSchema } from "./schema";

const client = new PlainClient({
  apiKey: process.env.PLAIN_API_KEY!,
});

export const requestAccessAction = action(requestAccessSchema, async () => {
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
    title: "Invoice access",
    customerIdentifier: {
      customerId: customer.data?.customer.id,
    },
    // Support
    labelTypeIds: ["lt_01HV93FQT6NSC1EN2HHA6BG9WK"],
    components: [
      {
        componentText: {
          text: "Invoice access",
        },
      },
    ],
  });

  return response;
});
