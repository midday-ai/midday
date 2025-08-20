import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
// import { notification } from "../../notifications/notification";

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
    // switch (status) {
    //   case "paid": {
    //     await notification.trigger({
    //       type: "invoice_paid",
    //       teamId,
    //       invoiceId,
    //       invoiceNumber,
    //       source: "automatic",
    //       sendEmail: true,
    //     });
    //     break;
    //   }
    //   case "overdue": {
    //     await notification.trigger({
    //       type: "invoice_overdue",
    //       teamId,
    //       invoiceId,
    //       invoiceNumber,
    //       customerName,
    //       source: "automatic",
    //       sendEmail: true,
    //     });
    //     break;
    //   }
    // }
  },
});
