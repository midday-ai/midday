import { HydrateClient, batchPrefetch, getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrokerDetailContent } from "./broker-detail-content";

export const metadata: Metadata = {
  title: "Broker Details | Abacus",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BrokerDetailPage(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  const broker = await queryClient.fetchQuery(
    trpc.brokers.getById.queryOptions({ id: params.id }),
  );

  if (!broker) {
    notFound();
  }

  batchPrefetch([
    trpc.brokers.getDeals.queryOptions({ brokerId: params.id }),
    trpc.brokers.getDealStats.queryOptions({ brokerId: params.id }),
    trpc.brokers.getCommissions.queryOptions({ brokerId: params.id }),
  ]);

  return (
    <HydrateClient>
      <BrokerDetailContent brokerId={params.id} broker={broker} />
    </HydrateClient>
  );
}
