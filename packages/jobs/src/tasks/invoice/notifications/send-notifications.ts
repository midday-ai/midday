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
  }),
  run: async ({ invoiceId, invoiceNumber, status, teamId, customerName }) => {
    const db = getDb();
    const notifications = new Notifications(db);

    switch (status) {
      case "paid": {
        await notifications.create(
          "invoice_paid",
          teamId,
          {
            invoiceId,
            invoiceNumber,
            source: "system",
          },
          {
            sendEmail: true,
          },
        );
        // TODO: migrating to worker
        // await sendToProviders(db, teamId, "invoice_paid", {
        //   invoiceId,
        //   invoiceNumber,
        //   customerName,
        // });
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
            source: "system",
          },
          {
            sendEmail: true,
          },
        );
        // TODO: migrating to worker
        // await sendToProviders(db, teamId, "invoice_overdue", {
        //   invoiceId,
        //   invoiceNumber,
        //   customerName,
        // });
        break;
      }
    }
  },
});
