"use client";

import {
  DealCard,
  DealCardSkeleton,
  type DealForCard,
} from "@/components/portal/deal-card";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { formatAmount } from "@midday/utils/format";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, use } from "react";

export default function DealsPage({
  params,
}: {
  params: Promise<{ portalId: string }>;
}) {
  const { portalId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <DealCardSkeleton />
        </div>
      }
    >
      <DealsContent portalId={portalId} />
    </Suspense>
  );
}

function DealsContent({ portalId }: { portalId: string }) {
  const trpc = useTRPC();
  const { data: portalData } = useSuspenseQuery(
    trpc.merchantPortal.getPortalData.queryOptions({ portalId }),
  );

  if (!portalData) return null;

  const { deals, summary } = portalData;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-serif">Your Deals</h1>

      {/* Combined total for multiple deals */}
      {deals.length > 1 && summary && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">
              All Deals Combined
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Total Balance
                </div>
                <div className="text-lg font-bold font-mono">
                  {formatAmount({
                    amount: summary.totalOutstanding,
                    currency: "USD",
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Paid</div>
                <div className="text-lg font-bold font-mono">
                  {formatAmount({
                    amount: summary.totalPaid,
                    currency: "USD",
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {deals.length === 1 ? (
        <DealCard deal={deals[0] as DealForCard} />
      ) : (
        <Tabs defaultValue={deals[0]?.id}>
          <TabsList className="w-full">
            {deals.map((deal) => (
              <TabsTrigger key={deal.id} value={deal.id} className="flex-1">
                {deal.dealCode}
              </TabsTrigger>
            ))}
          </TabsList>
          {deals.map((deal) => (
            <TabsContent key={deal.id} value={deal.id} className="mt-4">
              <DealCard deal={deal as DealForCard} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
