import { sendSlackTransactionNotifications } from "@midday/app-store/slack-notifications";
import { createClient } from "@midday/supabase/job";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  name: string;
  currency: string;
  category: string;
  status: string;
}

export async function handleTransactionSlackNotifications(
  teamId: string,
  transactions: Transaction[],
) {
  const supabase = createClient();

  // TODO: Get correct locale for formatting the amount
  const slackTransactions = transactions.map((transaction) => ({
    amount: Intl.NumberFormat("en-US", {
      style: "currency",
      currency: transaction.currency,
    }).format(transaction.amount),
    name: transaction.name,
  }));

  await sendSlackTransactionNotifications({
    teamId,
    transactions: slackTransactions,
    supabase,
  });
}
