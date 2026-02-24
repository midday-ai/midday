import type { NotificationHandler } from "../base";
import { transactionsExportedSchema } from "../schemas";

export const transactionsExported: NotificationHandler = {
  schema: transactionsExportedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    type: "transactions_exported",
    source: "system",
    priority: 7,
    metadata: {
      transactionIds: data.transactionIds,
      transactionCount: data.transactionCount,
      locale: data.locale,
      dateFormat: data.dateFormat,
      downloadLink: data.downloadLink,
    },
  }),

  createEmail: (data, _user, team) => ({
    template: "transactions-exported",
    emailType: "customer" as const,
    replyTo: data.userEmail,
    to: data.accountantEmail ? [data.accountantEmail] : [],
    bcc: data.sendCopyToMe && data.userEmail ? [data.userEmail] : undefined,
    subject: `${team.name} shared an export`,
    from: `${team.name} <middaybot@midday.ai>`,
    data: {
      teamName: team.name,
      transactionCount: data.transactionCount,
      downloadLink: data.downloadLink,
    },
  }),
};
