import { trpc } from "@jobs/client/trpc";
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

    await trpc.bankingService.deleteConnection.mutate({
      provider,
      id: referenceId!,
      accessToken: accessToken ?? undefined,
    });
  },
});
