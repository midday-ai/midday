import { ErrorFallback } from "@/components/error-fallback";
import { TransactionsModal } from "@/components/modals/transactions-modal";
import { SearchFilter } from "@/components/search-filter";
import { Table } from "@/components/tables/transactions";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionsActions } from "@/components/transactions-actions";
import { getTeamBankAccounts } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/cn";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

const VALID_FILTERS = ["attachments", "category", "date"];

export default async function Transactions({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // TODO: remove this
  const accounts = await getTeamBankAccounts();

  const page = typeof searchParams.page === "string" ? +searchParams.page : 0;
  const filter = {
    attachments: searchParams?.attachments,
  };
  const sort = searchParams?.sort?.split(":");

  const isOpen = Boolean(searchParams.step);
  const isEmpty = !accounts?.data?.length && !isOpen;
  const loadingKey = JSON.stringify({
    page,
    filter,
    sort,
    query: searchParams?.q,
  });

  return (
    <>
      <div className="flex justify-between py-6">
        <SearchFilter
          placeholder="Search or type filter"
          validFilters={VALID_FILTERS}
        />
        <TransactionsActions />
      </div>

      <div className={cn(isEmpty && "opacity-20 pointer-events-none")}>
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<Loading />} key={loadingKey}>
            <Table
              filter={filter}
              page={page}
              sort={sort}
              noAccounts={isEmpty}
              query={searchParams?.q}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      {!isOpen && isEmpty && <TransactionsModal />}
    </>
  );
}
