import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const invoiceNotification = schemaTask({
  id: "invoice-notification",
  schema: z.object({
    invoiceId: z.string().uuid(),
    status: z.enum(["paid", "overdue"]),
  }),
  run: async ({ invoiceId, status }) => {
    logger.info("Invoice notification triggered", { invoiceId });

    // TODO: Send notification to user depending on status
  },
});
