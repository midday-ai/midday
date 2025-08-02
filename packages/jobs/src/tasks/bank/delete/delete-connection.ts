import { client } from "@midday/engine-client";
import { deleteConnectionSchema } from "@midday/jobs/schema";
import { schemaTask } from "@trigger.dev/sdk";

export const deleteConnection = schemaTask({
  id: "delete-connection",
  schema: deleteConnectionSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 5,
  },
  run: async (payload) => {
    const { referenceId, provider, accessToken } = payload;

    await client.connections.delete.$delete({
      json: {
        id: referenceId!,
        provider,
        accessToken: accessToken ?? undefined,
      },
    });
  },
});
