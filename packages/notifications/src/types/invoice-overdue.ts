import { getI18n } from "@midday/email/locales";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { invoiceOverdueSchema } from "../schemas";

export const invoiceOverdue: NotificationHandler = {
  schema: invoiceOverdueSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_overdue",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
    },
  }),

  createEmail: (data, user) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });

    return {
      template: "invoice-overdue",
      emailType: "owners",
      subject: t("invoice.overdue.subject", {
        invoiceNumber: data.invoiceNumber,
      }),
      user,
      data: {
        invoiceNumber: data.invoiceNumber,
        customerName: data.customerName,
        link: `${getAppUrl()}/invoices?invoiceId=${data.invoiceId}&type=details`,
      },
    };
  },
};
