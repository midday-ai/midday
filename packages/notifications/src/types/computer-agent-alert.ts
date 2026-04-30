import type { NotificationHandler } from "../base";
import { agentAlertSchema } from "../schemas";

export const agentAlert: NotificationHandler = {
  schema: agentAlertSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "agent_alert",
    source: "system",
    priority: data.priority === "urgent" ? 2 : data.priority === "low" ? 6 : 4,
    metadata: {
      agentName: data.agentName,
      agentSlug: data.agentSlug,
      runId: data.runId,
      message: data.message,
      priority: data.priority,
    },
  }),

  createEmail: (data, user) => ({
    template: "plain",
    emailType: "team",
    subject: `Midday Agent: ${data.agentName}`,
    data: {
      fullName: user.full_name,
      agentName: data.agentName,
      message: data.message,
    },
  }),
};
