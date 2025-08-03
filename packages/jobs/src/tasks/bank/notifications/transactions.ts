import { getDb } from "@jobs/init";
import {
  handleTransactionEmails,
  handleTransactionSlackNotifications,
} from "@jobs/utils/transaction-notifications";
import { handleTransactionNotifications } from "@jobs/utils/transaction-notifications";
import { updateTransactionsAsNotified } from "@midday/db/queries";
import { getTeamOwnersWithTeamData } from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const transactionNotifications = schemaTask({
  id: "transaction-notifications",
  maxDuration: 300,
  schema: z.object({
    teamId: z.string(),
  }),
  run: async ({ teamId }) => {
    const db = getDb();

    try {
      // Mark all transactions as notified and get the ones that need to be notified about
      const transactionsData = await updateTransactionsAsNotified(db, {
        teamId,
      });

      const usersData = await getTeamOwnersWithTeamData(db, teamId);

      const sortedTransactions = transactionsData?.sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      if (sortedTransactions && sortedTransactions.length > 0) {
        await handleTransactionNotifications(usersData, sortedTransactions);
        await handleTransactionEmails(usersData, sortedTransactions);
        await handleTransactionSlackNotifications(teamId, sortedTransactions);
      }
    } catch (error) {
      await logger.error("Transactions notification", { error });

      throw error;
    }
  },
});
