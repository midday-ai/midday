"use client";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent } from "@midday/ui/card";
import { Progress } from "@midday/ui/progress";
import { Skeleton } from "@midday/ui/skeleton";
import { formatAmount } from "@midday/utils/format";
import { useSuspenseQuery } from "@tanstack/react-query";

type Props = {
  portalId: string;
};

export function BalanceCard({ portalId }: Props) {
  const trpc = useTRPC();
  const { data: portalData } = useSuspenseQuery(
    trpc.merchantPortal.getPortalData.queryOptions({ portalId }),
  );

  if (!portalData) return null;

  const { summary } = portalData;
  const totalOutstanding = summary?.totalOutstanding || 0;
  const totalPaid = summary?.totalPaid || 0;
  const totalPayback = summary?.totalPayback || 0;
  const paidPercentage =
    totalPayback > 0 ? Math.round((totalPaid / totalPayback) * 100) : 0;

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-1">
          Remaining Balance
        </div>
        <div className="text-4xl font-bold font-mono tracking-tight mb-6">
          {formatAmount({ amount: totalOutstanding, currency: "USD" })}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{paidPercentage}% paid off</span>
          </div>
          <Progress value={paidPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Paid:{" "}
              <span className="font-mono">
                {formatAmount({ amount: totalPaid, currency: "USD" })}
              </span>
            </span>
            <span>
              Total:{" "}
              <span className="font-mono">
                {formatAmount({ amount: totalPayback, currency: "USD" })}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BalanceCardSkeleton() {
  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-3 w-full mb-2" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
