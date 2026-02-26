import { ScrollableContent } from "@/components/scrollable-content";
import { TransactionsUploadZone } from "@/components/transactions-upload-zone";
import { loadSortParams } from "@/hooks/use-sort-params";
import { loadTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { loadTransactionTab } from "@/hooks/use-transaction-tab";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { TransactionsPageContent } from "./transactions-page-content";

export const metadata: Metadata = {
  title: "Transactions | abacus",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Transactions(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadTransactionFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);
  const { tab } = loadTransactionTab(searchParams);

  // Get unified table settings from cookie
  const initialSettings = await getInitialTableSettings("transactions");

  // Build query filters for both tabs
  const allTabFilter = {
    ...filter,
    amountRange: filter.amount_range ?? null,
    sort,
  };

  const reviewTabFilter = {
    ...filter,
    amountRange: filter.amount_range ?? null,
    sort,
    fulfilled: true,
    exported: false,
    pageSize: 10000,
  };

  // Prefetch all data needed for instant experience
  batchPrefetch([
    // Transaction data for both tabs
    trpc.transactions.get.infiniteQueryOptions(allTabFilter),
    trpc.transactions.get.infiniteQueryOptions(reviewTabFilter),
    trpc.transactions.getReviewCount.queryOptions(),
    // Syndication tab data
    trpc.syndication.getTeamTransactions.infiniteQueryOptions(
      {},
      { getNextPageParam: ({ meta }) => meta?.cursor },
    ),
    trpc.syndication.getTeamTransactionCount.queryOptions(),
    // Shared data used by table rows (assign user, tags)
    trpc.team.members.queryOptions(),
    trpc.tags.get.queryOptions(),
    // Apps for export bar (accounting providers)
    trpc.apps.get.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <TransactionsUploadZone>
          <TransactionsPageContent
            initialSettings={initialSettings}
            initialTab={tab}
          />
        </TransactionsUploadZone>
      </ScrollableContent>
    </HydrateClient>
  );
}
