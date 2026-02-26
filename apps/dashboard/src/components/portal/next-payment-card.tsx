"use client";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { formatAmount } from "@midday/utils/format";
import { useSuspenseQuery } from "@tanstack/react-query";
import { addBusinessDays, format, isToday, isWeekend } from "date-fns";

type Props = {
  portalId: string;
};

function getNextBusinessDay(): Date {
  let date = new Date();
  // If today is a weekend, find the next weekday
  if (isWeekend(date)) {
    date = addBusinessDays(date, 1);
  }
  return date;
}

export function NextPaymentCard({ portalId }: Props) {
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
          <div className="text-sm text-muted-foreground mb-1">Next Payment</div>
          <div className="text-lg font-semibold text-green-600">
            No active payments
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDailyPayment = activeDeals.reduce(
    (sum, d) => sum + (d.dailyPayment || 0),
    0,
  );
  const nextPaymentDate = getNextBusinessDay();
  const paymentIsToday = isToday(nextPaymentDate);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-1">Next Payment</div>
        <div className="text-2xl font-bold font-mono">
          {formatAmount({ amount: totalDailyPayment, currency: "USD" })}
        </div>
        <div className="mt-2 text-sm">
          {paymentIsToday ? (
            <span className="text-primary font-medium">
              Today &mdash; {format(nextPaymentDate, "EEEE, MMM d")}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {format(nextPaymentDate, "EEEE, MMM d")}
            </span>
          )}
        </div>
        {activeDeals.length > 1 && (
          <div className="text-xs text-muted-foreground mt-1">
            Across {activeDeals.length} active deals
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NextPaymentCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-36" />
      </CardContent>
    </Card>
  );
}
