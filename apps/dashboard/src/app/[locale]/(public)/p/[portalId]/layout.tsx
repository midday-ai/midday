import type { ReactNode } from "react";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { BrandThemeProvider } from "@/components/brand-theme-provider";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalBottomNav } from "@/components/portal/portal-bottom-nav";

type Props = {
  children: ReactNode;
  params: Promise<{ portalId: string }>;
};

export default async function PortalLayout({ children, params }: Props) {
  const { portalId } = await params;
  const queryClient = getQueryClient();

  // Prefetch portal data for branding and merchant info
  const portalData = await queryClient.fetchQuery(
    trpc.merchantPortal.getPortalData.queryOptions({ portalId }),
  );

  // If no MCA deals, render children directly (invoice portal fallback)
  if (!portalData || !portalData.deals || portalData.deals.length === 0) {
    return <HydrateClient>{children}</HydrateClient>;
  }

  const { merchant } = portalData;

  return (
    <HydrateClient>
      <BrandThemeProvider branding={merchant.team?.branding as any}>
        <div className="min-h-screen dotted-bg pb-20">
          <PortalHeader merchant={merchant} portalId={portalId} />

          <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
            {children}
          </main>

          <PortalBottomNav portalId={portalId} />

          <div className="fixed bottom-16 right-4 hidden md:block">
            <a
              href="https://abacuslabs.co?utm_source=merchant-portal"
              target="_blank"
              rel="noreferrer"
              className="text-[9px] text-[#878787]"
            >
              Powered by <span className="text-primary">Abacus</span>
            </a>
          </div>
        </div>
      </BrandThemeProvider>
    </HydrateClient>
  );
}
