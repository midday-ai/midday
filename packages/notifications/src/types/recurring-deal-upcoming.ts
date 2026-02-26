import { getI18n } from "@midday/email/locales";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { recurringDealUpcomingSchema } from "../schemas";

export const recurringDealUpcoming: NotificationHandler = {
  schema: recurringDealUpcomingSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "recurring_deal_upcoming",
    source: "system",
    priority: 4, // Medium-high priority - actionable notification
    metadata: {
      count: data.count,
      deals: data.deals,
    },
  }),

  createEmail: (data, user, team) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });

    return {
      template: "upcoming-deals",
      emailType: "owners",
      subject: t("deal.upcoming.subject", {
        count: data.count,
      }),
      data: {
        count: data.count,
        teamName: team.name,
        link: `${getAppUrl()}/deals`,
      },
    };
  },
};
