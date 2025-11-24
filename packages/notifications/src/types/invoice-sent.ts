import { getI18n } from "@midday/email/locales";
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

  createEmail: (data, user, team) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });

    return {
      template: "invoice",
      emailType: "customer",
      to: [data.customerEmail],
      subject: t("invoice.sent.subject", {
        teamName: team.name,
      }),
      from: `${team.name} <middaybot@er0s.co>`,
      data: {
        customerName: data.customerName,
        teamName: team.name,
        link: `${getAppUrl()}/i/${encodeURIComponent(
          data.token,
        )}?viewer=${encodeURIComponent(encrypt(data.customerEmail))}`,
      },
    };
  },
};
