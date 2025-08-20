import { encrypt } from "@midday/encryption";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { invoiceReminderSentSchema } from "../schemas";

export const invoiceReminderSent: NotificationHandler = {
  schema: invoiceReminderSentSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_reminder_sent",
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
    template: "invoice-reminder",
    emailType: "customer",
    to: [data.customerEmail],
    subject: `Reminder: Payment for ${data.invoiceNumber}`,
    from: `${team.name} <middaybot@midday.ai>`,
    data: {
      companyName: data.customerName,
      teamName: team.name,
      invoiceNumber: data.invoiceNumber,
      link: `${getAppUrl()}/i/${encodeURIComponent(
        data.token,
      )}?viewer=${encodeURIComponent(encrypt(data.customerEmail))}`,
    },
  }),
};
