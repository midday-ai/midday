import { getI18n } from "@midday/email/locales";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { recurringInvoiceUpcomingSchema } from "../schemas";

export const recurringInvoiceUpcoming: NotificationHandler = {
  schema: recurringInvoiceUpcomingSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "recurring_invoice_upcoming",
    source: "system",
    priority: 4, // Medium-high priority - actionable notification
    metadata: {
      count: data.count,
      invoices: data.invoices,
    },
  }),

  createEmail: (data, user, team) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });

    return {
      template: "upcoming-invoices",
      emailType: "owners",
      subject: t("invoice.upcoming.subject", {
        count: data.count,
      }),
      data: {
        count: data.count,
        teamName: team.name,
        link: `${getAppUrl()}/invoices`,
      },
    };
  },
};
