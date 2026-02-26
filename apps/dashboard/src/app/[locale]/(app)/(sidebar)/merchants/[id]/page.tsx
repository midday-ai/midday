import { HydrateClient, batchPrefetch, getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MerchantDetailContent } from "./merchant-detail-content";

export const metadata: Metadata = {
  title: "Merchant Details | Abacus",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MerchantDetailPage(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  const merchant = await queryClient.fetchQuery(
    trpc.merchants.getById.queryOptions({ id: params.id }),
  );

  if (!merchant) {
    notFound();
  }

  batchPrefetch([
    trpc.merchants.getMcaDeals.queryOptions({ merchantId: params.id }),
    trpc.merchants.getMcaDealStats.queryOptions({ merchantId: params.id }),
  ]);

  return (
    <HydrateClient>
      <MerchantDetailContent merchantId={params.id} merchant={merchant} />
    </HydrateClient>
  );
}
