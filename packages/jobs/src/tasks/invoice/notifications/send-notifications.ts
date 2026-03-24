import { getDb } from "@jobs/init";
import { Notifications } from "@midday/notifications";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const sendInvoiceNotifications = schemaTask({
  id: "invoice-notifications",
  machine: "micro",
  maxDuration: 60,
  schema: z.object({
    invoiceId: z.string().uuid(),
    invoiceNumber: z.string(),
    status: z.enum(["paid", "overdue"]),
    teamId: z.string(),
    customerName: z.string(),
    customerWebsite: z.string().optional(),
  }),
  run: async ({
    invoiceId,
    invoiceNumber,
    status,
    teamId,
    customerName,
    customerWebsite,
  }) => {
    const notifications = new Notifications(getDb());

    switch (status) {
      case "paid": {
        await notifications.create(
          "invoice_paid",
          teamId,
          {
            invoiceId,
            invoiceNumber,
            customerWebsite,
            source: "system",
          },
          {
            sendEmail: true,
          },
        );
        break;
      }
      case "overdue": {
        await notifications.create(
          "invoice_overdue",
          teamId,
          {
            invoiceId,
            invoiceNumber,
            customerName,
            customerWebsite,
            source: "system",
          },
          {
            sendEmail: true,
          },
        );
        break;
      }
    }
  },
});
