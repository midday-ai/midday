"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import NumberFlow from "@number-flow/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function AverageDaysToPayment() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.invoice.averageDaysToPayment.queryOptions(),
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-medium text-2xl font-serif">
          <NumberFlow value={data} willChange />d
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-[34px]">
        <div className="flex flex-col gap-2">
          <div>Average Days to Payment</div>
          <div className="text-sm text-muted-foreground">
            Cross all paid invoices this month
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
