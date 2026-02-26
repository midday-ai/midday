import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrokerPortalContent } from "./broker-portal-content";

export async function generateMetadata(props: {
  params: Promise<{ portalId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const queryClient = getQueryClient();

  try {
    const broker = await queryClient.fetchQuery(
      trpc.brokers.getByPortalId.queryOptions({
        portalId: params.portalId,
      }),
    );

    if (!broker) {
      return {
        title: "Portal Not Found",
        robots: { index: false, follow: false },
      };
    }

    const title = `${broker.name} | ${broker.team?.name || "Broker Portal"}`;
    const description = `Broker portal for ${broker.name}`;

    return {
      title,
      description,
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: "Portal Not Found",
      robots: { index: false, follow: false },
    };
  }
}

type Props = {
  params: Promise<{ portalId: string }>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  const broker = await queryClient.fetchQuery(
    trpc.brokers.getByPortalId.queryOptions({
      portalId: params.portalId,
    }),
  );

  if (!broker) {
    notFound();
  }

  // Prefetch deals
  await queryClient.fetchQuery(
    trpc.brokers.getPortalDeals.queryOptions({
      portalId: params.portalId,
    }),
  );

  return (
    <HydrateClient>
      <BrokerPortalContent portalId={params.portalId} />
    </HydrateClient>
  );
}
