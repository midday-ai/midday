import { getI18n } from "@midday/email/locales";
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

  createEmail: (data, user, team) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });
    const link = `${getAppUrl()}/i/${encodeURIComponent(
      data.token,
    )}?viewer=${encodeURIComponent(encrypt(data.customerEmail))}`;

    return {
      template: "invoice-reminder",
      emailType: "customer",
      to: [data.customerEmail],
      subject: t("invoice.reminder.subject", {
        invoiceNumber: data.invoiceNumber,
      }),
      from: `${team.name} <middaybot@midday.ai>`,
      data: {
        companyName: data.customerName,
        teamName: team.name,
        invoiceNumber: data.invoiceNumber,
        link,
        // Gmail structured data fields
        amount: data.amount,
        currency: data.currency,
        dueDate: data.dueDate,
      },
    };
  },
};
