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

  // Fetch merchant data
  const merchant = await queryClient.fetchQuery(
    trpc.merchants.getById.queryOptions({
      id: params.id,
    }),
  );

  if (!merchant) {
    notFound();
  }

  // Check if portal is enabled
  if (!merchant.portalEnabled || !merchant.portalId) {
    // Redirect to merchants page with a message
    redirect(`/merchants?error=portal_not_enabled&merchantId=${params.id}`);
  }

  // Fetch MCA deals if available
  let mcaDeals = null;
  try {
    mcaDeals = await queryClient.fetchQuery(
      trpc.merchantPortal.getPortalData.queryOptions({
        portalId: merchant.portalId,
      }),
    );
  } catch (e) {
    // MCA data might not exist, that's okay
  }

  return (
    <HydrateClient>
      <PortalPreviewContent
        merchant={merchant}
        portalId={merchant.portalId}
        mcaData={mcaDeals}
      />
    </HydrateClient>
  );
}
