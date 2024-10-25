import { Cookies } from "@/utils/constants";
import {
  getBankConnectionsByTeamId,
  getRecentTransactions,
  getTeamBankAccounts,
  getUser,
} from "@midday/supabase/cached-queries";
import { RecurringTransactionFrequency } from "@midday/supabase/queries";
import { TransactionSchema } from "@midday/supabase/types";
import { cookies } from "next/headers";
import { RecentTransactionsClient } from "./recent-transactions.client";

interface RecentTransactionsProps {
  limit?: number;
  accountId?: string;
  recurringTransactionFrequency?: RecurringTransactionFrequency;
  title: string;
  description: string;
  className?: string;
}

export async function RecentTransactionsServer({
  limit = 15,
  accountId,
  recurringTransactionFrequency,
  title,
  description,
  className,
}: RecentTransactionsProps) {
  // Retrieve the initial column visibility settings from cookies
  const initialColumnVisibility = JSON.parse(
    cookies().get(Cookies.TransactionsColumns)?.value || "[]",
  );

  // Fetch user, accounts, and bank connections server-side
  const [user, accounts, bankConnections] = await Promise.all([
    getUser(),
    getTeamBankAccounts(),
    getBankConnectionsByTeamId(),
  ]);

  // Fetch initial transactions server-side
  const initialTransactions = await getRecentTransactions({
    limit,
    accountId,
    recurring: recurringTransactionFrequency,
  });

  async function onAccountSelect(selectedAccountId?: string) {
    "use server";
    const newTransactions = await getRecentTransactions({
      limit,
      accountId: selectedAccountId,
      recurring: recurringTransactionFrequency,
    });
    return newTransactions?.data as TransactionSchema[];
  }

  async function onLoadMore(selectedAccountId?: string) {
    "use server";
    const newTransactions = await getRecentTransactions({
      limit: limit + 10,
      accountId: selectedAccountId,
      recurring: recurringTransactionFrequency,
    });
    return newTransactions?.data as TransactionSchema[];
  }

  return (
    <RecentTransactionsClient
      initialTransactions={initialTransactions?.data || []}
      accounts={
        accounts?.data?.map((account) => ({
          id: account.id,
          name: account.name ?? "Unknown",
          balance: account.balance ?? 0,
          currency: account.currency ?? "USD",
        })) || []
      }
      title={title}
      description={description}
      className={className}
      initialColumnVisibility={initialColumnVisibility}
      limit={limit}
      recurringTransactionFrequency={recurringTransactionFrequency}
      onAccountSelect={onAccountSelect}
      onLoadMore={onLoadMore}
    />
  );
}
