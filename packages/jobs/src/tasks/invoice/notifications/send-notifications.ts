import { getDb } from "@jobs/init";
import {
  handleOverdueInvoiceNotifications,
  handlePaidInvoiceNotifications,
} from "@jobs/utils/invoice-notifications";
import { getTeamOwnersByTeamId } from "@midday/db/queries";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const sendInvoiceNotifications = schemaTask({
  id: "invoice-notifications",
  schema: z.object({
    invoiceId: z.string().uuid(),
    invoiceNumber: z.string(),
    status: z.enum(["paid", "overdue"]),
    teamId: z.string(),
    customerName: z.string(),
  }),
  run: async ({ invoiceId, invoiceNumber, status, teamId, customerName }) => {
    const db = getDb();

    const user = await getTeamOwnersByTeamId(db, teamId);

    switch (status) {
      case "paid":
        await handlePaidInvoiceNotifications({
          user,
          invoiceId,
          invoiceNumber,
        });
        break;
      case "overdue":
        await handleOverdueInvoiceNotifications({
          user,
          invoiceId,
          invoiceNumber,
          customerName,
        });
        break;
    }
  },
});
