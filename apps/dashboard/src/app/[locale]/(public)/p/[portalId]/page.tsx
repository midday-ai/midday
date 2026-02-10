import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import { PortalContent } from "./portal-content";

export async function generateMetadata(props: {
  params: Promise<{ portalId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const queryClient = getQueryClient();

  try {
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
  } catch (_error) {
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

  // Prefetch customer and summary data
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
