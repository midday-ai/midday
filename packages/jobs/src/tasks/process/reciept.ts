import { Mistral } from "@mistralai/mistralai";
import { schemaTask } from "@trigger.dev/sdk/v3";

export const processReceipt = schemaTask({
  id: "process-receipt",
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
