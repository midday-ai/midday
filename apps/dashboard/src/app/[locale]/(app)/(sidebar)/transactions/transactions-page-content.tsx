"use client";

import { AddTransactions } from "@/components/add-transactions";
import { DataTable } from "@/components/tables/transactions/data-table";
import { Loading } from "@/components/tables/transactions/loading";
import { SyndicationDataTable } from "@/components/tables/transactions/syndication-data-table";
import { TransactionRulesButton } from "@/components/transaction-rules-button";
import { TransactionTabs } from "@/components/transaction-tabs";
import { TransactionsColumnVisibility } from "@/components/transactions-column-visibility";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { useTransactionTab } from "@/hooks/use-transaction-tab";
import type { TableSettings } from "@/utils/table-settings";
import { Suspense } from "react";

type Props = {
  initialSettings: Partial<TableSettings>;
  initialTab: "all" | "review" | "syndication";
};

export function TransactionsPageContent({ initialSettings, initialTab }: Props) {
  const { tab } = useTransactionTab();
  const activeTab = tab ?? initialTab ?? "all";
  const isSyndicationTab = activeTab === "syndication";

  return (
    <>
      <div className="flex justify-between items-center py-6">
        {!isSyndicationTab && <TransactionsSearchFilter />}
        {isSyndicationTab && <div />}
        <div className="flex items-center gap-4">
          {!isSyndicationTab && (
            <div className="hidden md:flex items-center gap-2">
              <TransactionRulesButton />
              <TransactionsColumnVisibility />
              <AddTransactions />
            </div>
          )}
          <TransactionTabs />
        </div>
      </div>

      {isSyndicationTab ? (
        <Suspense
          fallback={
            <div className="h-[calc(100vh-200px)] flex items-center justify-center">
              <div className="text-sm text-[#878787]">Loading syndication transactions...</div>
            </div>
          }
        >
          <SyndicationDataTable />
        </Suspense>
      ) : (
        <Suspense
          fallback={
            <Loading
              columnVisibility={initialSettings.columns}
              columnSizing={initialSettings.sizing}
              columnOrder={initialSettings.order}
            />
          }
        >
          <DataTable initialSettings={initialSettings} initialTab={initialTab === "syndication" ? "all" : initialTab} />
        </Suspense>
      )}
    </>
  );
}
