import { client } from "@midday/engine/client";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const deleteConnection = schemaTask({
  id: "delete-connection",
  schema: z.object({
    referenceId: z.string().uuid().optional().nullable(),
    provider: z.string(),
    accessToken: z.string().optional().nullable(),
  }),
  maxDuration: 60,
  queue: {
    concurrencyLimit: 5,
  },
  run: async (payload) => {
    const { referenceId, provider, accessToken } = payload;

    await client.connections.delete.$delete({
      json: {
        id: referenceId,
        provider,
        accessToken,
      },
    });
  },
});
