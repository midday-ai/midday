"use server";

import { PlainClient } from "@team-plain/typescript-sdk";
import { actionClient } from "./safe-action";
import { featureRequestSchema } from "./schema";

const client = new PlainClient({
  apiKey: process.env.PLAIN_API_KEY!,
});

export const featureRequestAction = actionClient
  .schema(featureRequestSchema)
  .action(async ({ parsedInput: data }) => {
    const response = await client.createThread({
      title: data.title,
      customerIdentifier: {
        emailAddress: data.email,
      },
      //   Feature request
      labelTypeIds: ["lt_01HV93E5SDCFVH8T9AGKKC99EM"],
      components: [
        {
          componentText: {
            text: data.description,
          },
        },
        {
          componentText: {
            text: data.category,
          },
        },
      ],
    });

    return response;
  });
