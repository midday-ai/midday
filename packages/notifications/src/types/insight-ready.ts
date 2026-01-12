import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { insightReadySchema } from "../schemas";

export const insightReady: NotificationHandler = {
  schema: insightReadySchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "insight_ready",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.insightId,
      periodType: data.periodType,
      periodLabel: data.periodLabel,
      periodNumber: data.periodNumber,
      periodYear: data.periodYear,
      opener: data.opener,
    },
  }),

  createEmail: (data, user) => {
    return {
      template: "insight-ready",
      emailType: "owners",
      subject: `Your ${data.periodLabel} business insight is ready`,
      user,
      data: {
        fullName: user.full_name,
        periodLabel: data.periodLabel,
        opener: data.opener || "Your weekly insight is ready to review.",
        audioUrl: data.audioPresignedUrl,
        insightId: data.insightId,
        locale: user.locale || "en",
      },
    };
  },
};
