"use client";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import NumberFlow from "@number-flow/react";
import { useSuspenseQuery } from "@tanstack/react-query";

export function NewCustomersThisMonth() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.invoice.newCustomersCount.queryOptions(),
  );

  return (
    <Card className="hidden sm:block">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono font-medium text-2xl">
          <NumberFlow value={data} willChange />
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-[34px]">
        <div className="flex flex-col gap-2">
          <div>New Customers</div>
          <div className="text-sm text-muted-foreground">
            Added past 30 days
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
