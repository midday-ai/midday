import {
  HydrateClient,
  batchPrefetch,
  getQueryClient,
  trpc,
} from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnderwritingDetail } from "./underwriting-detail";

export const metadata: Metadata = {
  title: "Underwriting Detail | Abacus",
};

type Props = {
  params: Promise<{ id: string; appId: string }>;
};

export default async function UnderwritingDetailPage(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  // Fetch application — 404 if not found
  const application = await queryClient.fetchQuery(
    trpc.underwritingApplications.getById.queryOptions({ id: params.appId }),
  );

  if (!application) {
    notFound();
  }

  // Fetch merchant for the header
  const merchant = await queryClient.fetchQuery(
    trpc.merchants.getById.queryOptions({ id: params.id }),
  );

  if (!merchant) {
    notFound();
  }

  // Prefetch documents and score in parallel
  batchPrefetch([
    trpc.underwritingApplications.getDocuments.queryOptions({
      applicationId: params.appId,
    }),
    trpc.underwritingApplications.getScore.queryOptions({
      applicationId: params.appId,
    }),
  ]);

  return (
    <HydrateClient>
      <UnderwritingDetail
        merchantId={params.id}
        applicationId={params.appId}
        merchant={{
          id: merchant.id,
          name: merchant.name,
          email: merchant.email,
          website: merchant.website,
        }}
      />
    </HydrateClient>
  );
}
