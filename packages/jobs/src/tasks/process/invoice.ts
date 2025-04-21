import { schemaTask } from "@trigger.dev/sdk/v3";

export const processInvoice = schemaTask({
  id: "process-invoice",
  maxDuration: 800,
  retry: {
    maxAttempts: 2,
  },
  //   schema: z.object({
  //     teamId: z.string().uuid(),
  //     documentId: z.string().uuid(),
  //   }),
  run: async () => {},
});
