import { getQueryClient, trpc } from "@/trpc/server";
import { AlertBanner } from "@/components/portal/alert-banner";
import { BalanceCard, BalanceCardSkeleton } from "@/components/portal/balance-card";
import {
  NextPaymentCard,
  NextPaymentCardSkeleton,
} from "@/components/portal/next-payment-card";
import {
  PayoffEstimateCard,
  PayoffEstimateCardSkeleton,
} from "@/components/portal/payoff-estimate-card";
import { QuickActions } from "@/components/portal/quick-actions";
import { Suspense } from "react";

type Props = {
  params: Promise<{ portalId: string }>;
};

export default async function PortalHomePage({ params }: Props) {
  const { portalId } = await params;
  const queryClient = getQueryClient();

  // Prefetch portal data (likely already cached from layout)
  await queryClient.prefetchQuery(
    trpc.merchantPortal.getPortalData.queryOptions({ portalId }),
  );

  return (
    <div className="space-y-5">
      <Suspense>
        <AlertBanner portalId={portalId} />
      </Suspense>

      <Suspense fallback={<BalanceCardSkeleton />}>
        <BalanceCard portalId={portalId} />
      </Suspense>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Suspense fallback={<NextPaymentCardSkeleton />}>
          <NextPaymentCard portalId={portalId} />
        </Suspense>
        <Suspense fallback={<PayoffEstimateCardSkeleton />}>
          <PayoffEstimateCard portalId={portalId} />
        </Suspense>
      </div>

      <QuickActions portalId={portalId} />
    </div>
  );
}
