import { BrandThemeProvider } from "@/components/brand-theme-provider";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { formatAmount } from "@midday/utils/format";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PortalPreviewContent } from "./portal-preview-content";

export const metadata: Metadata = {
  title: "Portal Preview | Abacus",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PortalPreviewPage(props: Props) {
  const params = await props.params;
  const queryClient = getQueryClient();

  // Fetch customer data
  const customer = await queryClient.fetchQuery(
    trpc.customers.getById.queryOptions({
      id: params.id,
    }),
  );

  if (!customer) {
    notFound();
  }

  // Check if portal is enabled
  if (!customer.portalEnabled || !customer.portalId) {
    // Redirect to customers page with a message
    redirect(`/customers?error=portal_not_enabled&customerId=${params.id}`);
  }

  // Fetch MCA deals if available
  let mcaDeals = null;
  try {
    mcaDeals = await queryClient.fetchQuery(
      trpc.merchantPortal.getPortalData.queryOptions({
        portalId: customer.portalId,
      }),
    );
  } catch (e) {
    // MCA data might not exist, that's okay
  }

  return (
    <HydrateClient>
      <PortalPreviewContent
        customer={customer}
        portalId={customer.portalId}
        mcaData={mcaDeals}
      />
    </HydrateClient>
  );
}
