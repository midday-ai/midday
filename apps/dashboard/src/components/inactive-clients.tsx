"use client";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import NumberFlow from "@number-flow/react";
import { useSuspenseQuery } from "@tanstack/react-query";

export function InactiveClients() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.invoice.inactiveClientsCount.queryOptions(),
  );

  return (
    <Card className="hidden sm:block">
      <CardHeader className="pb-3">
        <CardTitle className="font-medium text-2xl">
          <NumberFlow value={data} willChange />
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-[34px]">
        <div className="flex flex-col gap-2">
          <div>Inactive Clients</div>
          <div className="text-sm text-muted-foreground">
            No invoices or time tracked past 30 days
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
