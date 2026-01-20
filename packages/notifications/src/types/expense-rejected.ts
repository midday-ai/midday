import type { NotificationHandler } from "../base";
import { expenseRejectedSchema } from "../schemas";

export const expenseRejected: NotificationHandler = {
  schema: expenseRejectedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "expense_rejected",
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
      rejectionReason: data.rejectionReason,
    },
  }),

  createEmail: (data, user, teamContext) => ({
    emailType: "team" as const,
    to: user.email,
    subject: `経費が却下されました: ¥${data.amount.toLocaleString()}`,
    templateId: "expense-rejected",
    data: {
      requesterName: data.requesterName || "チームメンバー",
      approverName: data.approverName || "承認者",
      amount: data.amount,
      currency: data.currency,
      rejectionReason: data.rejectionReason,
      teamName: teamContext.name,
      expenseApprovalId: data.expenseApprovalId,
    },
  }),
};
