import type { NotificationHandler } from "../base";
import { expenseApprovedSchema } from "../schemas";

export const expenseApproved: NotificationHandler = {
  schema: expenseApprovedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "expense_approved",
    source: "user",
    priority: 3, // Important notification for requester
    metadata: {
      expenseApprovalId: data.expenseApprovalId,
      requesterId: data.requesterId,
      requesterName: data.requesterName,
      approverId: data.approverId,
      approverName: data.approverName,
      amount: data.amount,
      currency: data.currency,
    },
  }),

  createEmail: (data, user, teamContext) => ({
    emailType: "team" as const,
    to: user.email,
    subject: `経費が承認されました: ¥${data.amount.toLocaleString()}`,
    templateId: "expense-approved",
    data: {
      requesterName: data.requesterName || "チームメンバー",
      approverName: data.approverName || "承認者",
      amount: data.amount,
      currency: data.currency,
      teamName: teamContext.name,
      expenseApprovalId: data.expenseApprovalId,
    },
  }),
};
