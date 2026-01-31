import { getI18n } from "@midday/email/locales";
import { encrypt } from "@midday/encryption";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { eInvoiceSentSchema } from "../schemas";

export const eInvoiceSent: NotificationHandler = {
  schema: eInvoiceSentSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "e_invoice_sent",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
    },
  }),

  createEmail: (data, _user, team) => {
    const { t } = getI18n({ locale: "en" });

    return {
      template: "e-invoice-delivered",
      emailType: "customer",
      to: [data.customerEmail],
      subject: t("invoice.eInvoiceDelivered.subject", {
        invoiceNumber: data.invoiceNumber,
      }),
      from: `${team.name} <middaybot@midday.ai>`,
      data: {
        customerName: data.customerName,
        teamName: team.name,
        invoiceNumber: data.invoiceNumber,
        link: `${getAppUrl()}/i/${encodeURIComponent(
          data.token,
        )}?viewer=${encodeURIComponent(encrypt(data.customerEmail))}`,
      },
    };
  },
};
