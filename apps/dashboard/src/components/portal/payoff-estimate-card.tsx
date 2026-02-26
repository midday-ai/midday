"use client";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { addBusinessDays, format } from "date-fns";

type Props = {
  portalId: string;
};

function estimatePayoffDate(
  currentBalance: number,
  dailyPayment: number,
): Date | null {
  if (dailyPayment <= 0 || currentBalance <= 0) return null;
  const businessDaysRemaining = Math.ceil(currentBalance / dailyPayment);
  return addBusinessDays(new Date(), businessDaysRemaining);
}

export function PayoffEstimateCard({ portalId }: Props) {
  const trpc = useTRPC();
  const { data: portalData } = useSuspenseQuery(
    trpc.merchantPortal.getPortalData.queryOptions({ portalId }),
  );

  if (!portalData) return null;

  const { deals } = portalData;
  const activeDeals = deals.filter((d) => d.status === "active");

  if (activeDeals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground mb-1">
            Estimated Payoff
          </div>
          <div className="text-lg font-semibold text-green-600">All paid!</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate estimated payoff for the deal with the latest payoff date
  let latestPayoff: Date | null = null;
  for (const deal of activeDeals) {
    // Use stored expectedPayoffDate if available, otherwise calculate
    if (deal.expectedPayoffDate) {
      const d = new Date(deal.expectedPayoffDate);
      if (!latestPayoff || d > latestPayoff) latestPayoff = d;
    } else if (deal.dailyPayment && deal.dailyPayment > 0) {
      const estimated = estimatePayoffDate(
        deal.currentBalance,
        deal.dailyPayment,
      );
      if (estimated && (!latestPayoff || estimated > latestPayoff)) {
        latestPayoff = estimated;
      }
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-1">
          Estimated Payoff
        </div>
        {latestPayoff ? (
          <>
            <div className="text-lg font-semibold">
              Around {format(latestPayoff, "MMMM d, yyyy")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Based on your current payment schedule
            </div>
          </>
        ) : (
          <div className="text-lg text-muted-foreground">
            Unable to estimate
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PayoffEstimateCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-6 w-44 mb-1" />
        <Skeleton className="h-3 w-52" />
      </CardContent>
    </Card>
  );
}
