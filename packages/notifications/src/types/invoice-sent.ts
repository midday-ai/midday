import type { NotificationHandler } from "../base";
import { invoiceSentSchema } from "../schemas";

export const invoiceSent: NotificationHandler = {
  schema: invoiceSentSchema,
  activityType: "invoice_sent",
  defaultPriority: 3,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_sent",
    source: "system",
    priority: 3,
    metadata: {
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      userName: user.full_name,
      teamName: user.team_name,
    },
  }),
};
