import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { McaPortalContent } from "./mca-portal-content";
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
      const title = `${mcaData.customer.name} | ${mcaData.customer.team?.name || "Portal"}`;
      const description = `Merchant portal for ${mcaData.customer.name}`;

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

    // Fall back to invoice portal data
    const data = await queryClient.fetchQuery(
      trpc.customers.getByPortalId.queryOptions({
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

    const title = `${data.customer.name} | ${data.customer.team.name}`;
    const description = `Customer portal for ${data.customer.name}`;

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

  // If MCA deals exist, show MCA portal
  if (mcaPortalData && mcaPortalData.deals && mcaPortalData.deals.length > 0) {
    return (
      <HydrateClient>
        <McaPortalContent portalId={params.portalId} />
      </HydrateClient>
    );
  }

  // Fall back to invoice portal
  const portalData = await queryClient.fetchQuery(
    trpc.customers.getByPortalId.queryOptions({
      portalId: params.portalId,
    }),
  );

  if (!portalData) {
    notFound();
  }

  // Prefetch invoices
  await queryClient.fetchInfiniteQuery(
    trpc.customers.getPortalInvoices.infiniteQueryOptions({
      portalId: params.portalId,
    }),
  );

  return (
    <HydrateClient>
      <PortalContent portalId={params.portalId} />
    </HydrateClient>
  );
}
