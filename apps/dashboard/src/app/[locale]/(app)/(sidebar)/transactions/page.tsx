import { DataTableV2 } from "@/components/tables/transactions/data-table-v2";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionsActions } from "@/components/transactions-actions";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { sortParamsCache } from "@/hooks/use-sort-params";
import { transactionFilterParamsCache } from "@/hooks/use-transaction-filter-params";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const filter = transactionFilterParamsCache.parse(searchParams);
  const { sort } = sortParamsCache.parse(searchParams);

  prefetch(
    trpc.transactions.get.infiniteQueryOptions({
      filter,
      sort,
    }),
  );

  return (
    <>
      <div className="flex justify-between py-6">
        <TransactionsSearchFilter />
        <TransactionsActions />
      </div>

      <HydrateClient>
        <Suspense fallback={<Loading />}>
          <DataTableV2 />
        </Suspense>
      </HydrateClient>
    </>
  );
}
