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
      merchantName: data.merchantName,
      merchantEmail: data.merchantEmail,
    },
  }),

  createEmail: (data, user, team) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });

    return {
      template: "invoice",
      emailType: "merchant",
      to: [data.merchantEmail],
      subject: t("invoice.sent.subject", {
        teamName: team.name,
      }),
      from: `${team.name} <middaybot@midday.ai>`,
      data: {
        merchantName: data.merchantName,
        teamName: team.name,
        link: `${getAppUrl()}/i/${encodeURIComponent(
          data.token,
        )}?viewer=${encodeURIComponent(encrypt(data.merchantEmail))}`,
      },
    };
  },
};
