"use server";

import { PlainClient } from "@team-plain/typescript-sdk";
import { authActionClient } from "./safe-action";
import { requestAccessSchema } from "./schema";

const client = new PlainClient({
  apiKey: process.env.PLAIN_API_KEY!,
});

export const requestAccessAction = authActionClient
  .schema(requestAccessSchema)
  .action(async ({ ctx: { user } }) => {
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
