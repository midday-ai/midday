import { ExpenseApprovalsPage } from "@/components/expense-approvals";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expense Approvals | Midday",
};

export default async function Page() {
  prefetch(trpc.expenseApprovals.list.queryOptions({}));
  prefetch(trpc.expenseApprovals.pendingCount.queryOptions({}));

  return (
    <HydrateClient>
      <ExpenseApprovalsPage />
    </HydrateClient>
  );
}
