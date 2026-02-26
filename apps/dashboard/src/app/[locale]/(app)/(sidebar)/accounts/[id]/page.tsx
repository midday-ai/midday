import { HydrateClient, batchPrefetch, getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountDetailContent } from "./account-detail-content";

export const metadata: Metadata = {
  title: "Account Details | Abacus",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetailPage(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  const account = await queryClient.fetchQuery(
    trpc.bankAccounts.getById.queryOptions({ id: params.id }),
  );

  if (!account) {
    notFound();
  }

  batchPrefetch([
    trpc.transactions.get.infiniteQueryOptions({
      accounts: [params.id],
      sort: ["date", "desc"],
    }),
  ]);

  return (
    <HydrateClient>
      <AccountDetailContent accountId={params.id} account={account} />
    </HydrateClient>
  );
}
