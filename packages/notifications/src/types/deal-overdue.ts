import { getI18n } from "@midday/email/locales";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { dealOverdueSchema } from "../schemas";

export const dealOverdue: NotificationHandler = {
  schema: dealOverdueSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "deal_overdue",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.dealId,
      dealNumber: data.dealNumber,
      merchantName: data.merchantName,
    },
  }),

  createEmail: (data, user) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });

    return {
      template: "deal-overdue",
      emailType: "owners",
      subject: t("deal.overdue.subject", {
        dealNumber: data.dealNumber,
      }),
      user,
      data: {
        dealNumber: data.dealNumber,
        merchantName: data.merchantName,
        link: `${getAppUrl()}/deals?dealId=${data.dealId}&type=details`,
      },
    };
  },
};
