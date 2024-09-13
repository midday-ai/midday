"use server";

import { PlainClient } from "@team-plain/typescript-sdk";

import { action } from "./safe-action";
import { featureRequestSchema } from "./schema";

const client = new PlainClient({
  apiKey: process.env.PLAIN_API_KEY!,
});

export const featureRequestAction = action(
  featureRequestSchema,
  async (data) => {
    console.log(data);
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

    console.log(response);

    return response;
  },
);
