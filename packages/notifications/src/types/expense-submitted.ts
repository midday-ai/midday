import type { NotificationHandler } from "../base";
import { expenseSubmittedSchema } from "../schemas";

export const expenseSubmitted: NotificationHandler = {
  schema: expenseSubmittedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "expense_submitted",
    source: "user",
    priority: 3, // Important notification for approvers
    metadata: {
      expenseApprovalId: data.expenseApprovalId,
      requesterId: data.requesterId,
      requesterName: data.requesterName,
      amount: data.amount,
      currency: data.currency,
      note: data.note,
    },
  }),

  createEmail: (data, user, teamContext) => ({
    emailType: "team" as const,
    to: user.email,
    subject: `経費承認申請: ${data.requesterName || "チームメンバー"}`,
    templateId: "expense-submitted",
    data: {
      requesterName: data.requesterName || "チームメンバー",
      amount: data.amount,
      currency: data.currency,
      note: data.note,
      teamName: teamContext.name,
      expenseApprovalId: data.expenseApprovalId,
    },
  }),
};
