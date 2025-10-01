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

  createEmail: (data, user, team) => {
    // Only send email if accountantEmail is provided
    if (!data.accountantEmail || !data.downloadLink) {
      return undefined;
    }

    return {
      template: "transactions-exported",
      emailType: "customer",
      to: [data.accountantEmail],
      subject: `Transaction Export from ${team.name}`,
      from: `${team.name} <middaybot@midday.ai>`,
      data: {
        accountantEmail: data.accountantEmail,
        teamName: team.name,
        transactionCount: data.transactionCount,
        downloadLink: data.downloadLink,
      },
    };
  },
};
