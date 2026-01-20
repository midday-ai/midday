import type { NotificationHandler } from "../base";
import { expensePaidSchema } from "../schemas";

export const expensePaid: NotificationHandler = {
  schema: expensePaidSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "expense_paid",
    source: "user",
    priority: 5, // Lower priority - informational
    metadata: {
      expenseApprovalId: data.expenseApprovalId,
      requesterId: data.requesterId,
      requesterName: data.requesterName,
      amount: data.amount,
      currency: data.currency,
    },
  }),

  createEmail: (data, user, teamContext) => ({
    emailType: "team" as const,
    to: user.email,
    subject: `経費が支払われました: ¥${data.amount.toLocaleString()}`,
    templateId: "expense-paid",
    data: {
      requesterName: data.requesterName || "チームメンバー",
      amount: data.amount,
      currency: data.currency,
      teamName: teamContext.name,
      expenseApprovalId: data.expenseApprovalId,
    },
  }),
};
