"use client";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";

export function MostActiveMerchant() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.deal.mostActiveMerchant.queryOptions(),
  );

  if (!data) {
    return (
      <Card className="hidden sm:block">
        <CardHeader className="pb-2">
          <CardTitle className="font-medium text-2xl font-serif">
            No Active Merchant
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-5">
          <div className="flex flex-col gap-2">
            <div>Most Active Merchant</div>
            <div className="text-sm text-muted-foreground">
              No merchant activity past 30 days
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hidden sm:block">
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-2xl font-serif">
          {data.merchantName}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-5">
        <div className="flex flex-col gap-2">
          <div>Most Active Merchant</div>
          <div className="text-sm text-muted-foreground">
            {data.dealCount > 0 && (
              <>
                {data.dealCount} deal{data.dealCount !== 1 ? "s" : ""}
              </>
            )}
            {" past 30 days"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
