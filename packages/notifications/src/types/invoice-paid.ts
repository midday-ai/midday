import { getI18n } from "@midday/email/locales";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { invoicePaidSchema } from "../schemas";

export const invoicePaid: NotificationHandler = {
  schema: invoicePaidSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_paid",
    source: data.source === "manual" ? "user" : "system",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      paidAt: data.paidAt,
      source: data.source,
    },
  }),

  createEmail: (data, user) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });

    return {
      template: "invoice-paid",
      emailType: "owners",
      subject: t("invoice.paid.subject", {
        invoiceNumber: data.invoiceNumber,
      }),
      user,
      data: {
        invoiceNumber: data.invoiceNumber,
        link: `${getAppUrl()}/invoices?invoiceId=${data.invoiceId}&type=details`,
      },
    };
  },
};
