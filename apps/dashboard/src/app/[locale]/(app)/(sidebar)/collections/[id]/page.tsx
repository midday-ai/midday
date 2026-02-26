import { HydrateClient, batchPrefetch, getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionDetailContent } from "./collection-detail-content";

export const metadata: Metadata = {
  title: "Collection Case | Abacus",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CollectionDetailPage(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  const caseData = await queryClient.fetchQuery(
    trpc.collections.getById.queryOptions({ id: params.id }),
  );

  if (!caseData) {
    notFound();
  }

  batchPrefetch([
    trpc.collections.getNotes.queryOptions({ caseId: params.id }),
    trpc.collectionConfig.getStages.queryOptions(),
    trpc.collectionConfig.getAgencies.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <CollectionDetailContent caseId={params.id} initialData={caseData} />
    </HydrateClient>
  );
}
