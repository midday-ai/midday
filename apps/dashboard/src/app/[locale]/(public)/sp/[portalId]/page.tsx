import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SyndicatorPortalContent } from "./syndicator-portal-content";

export async function generateMetadata(props: {
  params: Promise<{ portalId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const queryClient = getQueryClient();

  try {
    const syndicator = await queryClient.fetchQuery(
      trpc.syndication.getByPortalId.queryOptions({
        portalId: params.portalId,
      }),
    );

    if (!syndicator) {
      return {
        title: "Portal Not Found",
        robots: { index: false, follow: false },
      };
    }

    const title = `${syndicator.name} | ${syndicator.team?.name || "Syndicator Portal"}`;
    const description = `Syndicator portal for ${syndicator.name}`;

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

  const syndicator = await queryClient.fetchQuery(
    trpc.syndication.getByPortalId.queryOptions({
      portalId: params.portalId,
    }),
  );

  if (!syndicator) {
    notFound();
  }

  // Prefetch deals
  await queryClient.fetchQuery(
    trpc.syndication.getPortalDeals.queryOptions({
      portalId: params.portalId,
    }),
  );

  return (
    <HydrateClient>
      <SyndicatorPortalContent portalId={params.portalId} />
    </HydrateClient>
  );
}
