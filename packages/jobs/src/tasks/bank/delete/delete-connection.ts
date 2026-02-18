import { deleteConnectionSchema } from "@midday/jobs/schema";
import { trpc } from "@midday/trpc";
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

    await trpc.banking.deleteConnection.mutate({
      id: referenceId!,
      provider,
      accessToken: accessToken ?? undefined,
    });
  },
});
