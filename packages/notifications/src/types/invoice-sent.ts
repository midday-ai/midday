import { encrypt } from "@midday/encryption";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { invoiceSentSchema } from "../schemas";

export const invoiceSent: NotificationHandler = {
  schema: invoiceSentSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_sent",
    source: "user",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
    },
  }),

  createEmail: (data, _, team) => ({
    template: "invoice-sent",
    emailType: "customer",
    to: [data.customerEmail],
    subject: `${team.name} sent you an invoice`,
    from: `${team.name} <middaybot@midday.ai>`,
    data: {
      customerName: data.customerName,
      teamName: team.name,
      link: `${getAppUrl()}/i/${encodeURIComponent(
        data.token,
      )}?viewer=${encodeURIComponent(encrypt(data.customerEmail))}`,
    },
  }),
};
