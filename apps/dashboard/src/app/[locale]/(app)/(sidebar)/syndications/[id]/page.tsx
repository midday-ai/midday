import {
  HydrateClient,
  batchPrefetch,
  getQueryClient,
  trpc,
} from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SyndicatorDetailContent } from "./syndicator-detail-content";

export const metadata: Metadata = {
  title: "Syndicator Details | Abacus",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SyndicatorDetailPage(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  const syndicator = await queryClient.fetchQuery(
    trpc.syndication.getById.queryOptions({ id: params.id }),
  );

  if (!syndicator) {
    notFound();
  }

  batchPrefetch([
    trpc.syndication.getDeals.queryOptions({ syndicatorId: params.id }),
    trpc.syndication.getDealStats.queryOptions({ syndicatorId: params.id }),
  ]);

  return (
    <HydrateClient>
      <SyndicatorDetailContent
        syndicatorId={params.id}
        syndicator={syndicator}
      />
    </HydrateClient>
  );
}
