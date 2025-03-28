import { DataTable } from "@/components/tables/transactions/data-table";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionsActions } from "@/components/transactions-actions";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { sortParamsCache } from "@/hooks/use-sort-params";
import { transactionFilterParamsCache } from "@/hooks/use-transaction-filter-params";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
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

  const queryClient = getQueryClient();

  // NOTE: Because we prefetch using Next.js Link, we can use this to actually fetch the data
  await queryClient.fetchInfiniteQuery(
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
          <DataTable />
        </Suspense>
      </HydrateClient>
    </>
  );
}
