import { DataTableV2 } from "@/components/tables/transactions/data-table-v2";
import { Loading } from "@/components/tables/transactions/loading";
import { sortParamsCache } from "@/hooks/use-sort-params";
import { transactionFilterParamsCache } from "@/hooks/use-transaction-filter-params";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions(
  props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const filter = transactionFilterParamsCache.parse(searchParams);
  const { sort } = sortParamsCache.parse(searchParams);

  prefetch(
    trpc.transactions.getTransactions.infiniteQueryOptions({
      teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
      cursor: "0",
    }),
  );

  return (
    <>
      <HydrateClient>
        <Suspense fallback={<Loading />}>
          <DataTableV2 />
        </Suspense>
      </HydrateClient>
    </>
  );
}
