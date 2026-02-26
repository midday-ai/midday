import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PortalContent } from "./portal-content";

export async function generateMetadata(props: {
  params: Promise<{ portalId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const queryClient = getQueryClient();

  try {
    // Try MCA portal data first
    const mcaData = await queryClient.fetchQuery(
      trpc.merchantPortal.getPortalData.queryOptions({
        portalId: params.portalId,
      }),
    );

    if (mcaData) {
      const title = `${mcaData.merchant.name} | ${mcaData.merchant.team?.name || "Portal"}`;
      const description = `Merchant portal for ${mcaData.merchant.name}`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
        },
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    // Fall back to deal portal data
    const data = await queryClient.fetchQuery(
      trpc.merchants.getByPortalId.queryOptions({
        portalId: params.portalId,
      }),
    );

    if (!data) {
      return {
        title: "Portal Not Found",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const title = `${data.merchant.name} | ${data.merchant.team.name}`;
    const description = `Merchant portal for ${data.merchant.name}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch (error) {
    return {
      title: "Portal Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

type Props = {
  params: Promise<{ portalId: string }>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  // Try to fetch MCA portal data first
  const mcaPortalData = await queryClient.fetchQuery(
    trpc.merchantPortal.getPortalData.queryOptions({
      portalId: params.portalId,
    }),
  );

  // If MCA deals exist, redirect to the multi-screen portal
  if (mcaPortalData && mcaPortalData.deals && mcaPortalData.deals.length > 0) {
    redirect(`/p/${params.portalId}/home`);
  }

  // Fall back to deal portal
  const portalData = await queryClient.fetchQuery(
    trpc.merchants.getByPortalId.queryOptions({
      portalId: params.portalId,
    }),
  );

  if (!portalData) {
    notFound();
  }

  // Prefetch deals
  await queryClient.fetchInfiniteQuery(
    trpc.merchants.getPortalDeals.infiniteQueryOptions({
      portalId: params.portalId,
    }),
  );

  return (
    <HydrateClient>
      <PortalContent portalId={params.portalId} />
    </HydrateClient>
  );
}
