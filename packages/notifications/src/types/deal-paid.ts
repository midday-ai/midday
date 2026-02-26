import { getI18n } from "@midday/email/locales";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { dealPaidSchema } from "../schemas";

export const dealPaid: NotificationHandler = {
  schema: dealPaidSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "deal_paid",
    source: data.source === "manual" ? "user" : "system",
    priority: 3,
    metadata: {
      recordId: data.dealId,
      dealNumber: data.dealNumber,
      merchantName: data.merchantName,
      paidAt: data.paidAt,
      source: data.source,
    },
  }),

  createEmail: (data, user) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });

    return {
      template: "deal-paid",
      emailType: "owners",
      subject: t("deal.paid.subject", {
        dealNumber: data.dealNumber,
      }),
      user,
      data: {
        dealNumber: data.dealNumber,
        link: `${getAppUrl()}/deals?dealId=${data.dealId}&type=details`,
      },
    };
  },
};
