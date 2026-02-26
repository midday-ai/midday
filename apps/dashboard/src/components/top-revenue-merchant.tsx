"use client";

import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FormatAmount } from "./format-amount";

export function TopRevenueMerchant() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const { data: user } = useUserQuery();
  const { data } = useSuspenseQuery(
    trpc.deal.topRevenueMerchant.queryOptions(),
  );

  if (!data) {
    return (
      <Card className="hidden sm:block">
        <CardHeader className="pb-2">
          <CardTitle className="font-medium text-2xl font-serif">
            No Revenue Merchant
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-5">
          <div className="flex flex-col gap-2">
            <div>Top Revenue Merchant</div>
            <div className="text-sm text-muted-foreground">
              No revenue generated past 30 days
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
          <div>Top Revenue Merchant</div>
          <div className="text-sm text-muted-foreground">
            <FormatAmount
              amount={data.totalRevenue}
              currency={data.currency || team?.baseCurrency || "USD"}
              locale={user?.locale ?? undefined}
            />{" "}
            from {data.dealCount} deal{data.dealCount !== 1 ? "s" : ""}{" "}
            past 30 days
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
