"use client";

import { bulkUpdateTransactionsAction } from "@/actions/bulk-update-transactions-action";
import { ColumnVisibility } from "@/components/column-visibility";
import { Filter } from "@/components/filter";
import { SelectCategory } from "@/components/select-category";
import { sections } from "@/components/tables/transactions/filters";
import { useTransactionsStore } from "@/store/transactions";
import { useAction } from "next-safe-action/hooks";

export function TransactionsActions() {
  const { transactionIds } = useTransactionsStore();
  const bulkUpdateTransactions = useAction(bulkUpdateTransactionsAction);

  if (transactionIds?.length) {
    return (
      <div className="ml-auto">
        <div className="flex items-center">
          <span className="text-sm text-[#606060] w-full">Bulk edit</span>
          <div className="h-8 w-[1px] bg-border ml-4 mr-4" />

          <SelectCategory
            placeholder="Category"
            onChange={(category) => {
              const payload = transactionIds.map((transaction) => ({
                id: transaction,
                category,
              }));

              bulkUpdateTransactions.execute(payload);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <Filter sections={sections} />
      <ColumnVisibility />
    </div>
  );
}
