"use client";

import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FormatAmount } from "./format-amount";

export function TopRevenueClient() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const { data: user } = useUserQuery();
  const { data } = useSuspenseQuery(
    trpc.invoice.topRevenueClient.queryOptions(),
  );

  if (!data) {
    return (
      <Card className="hidden sm:block">
        <CardHeader className="pb-3">
          <CardTitle className="font-mono font-medium text-2xl">
            No Revenue Client
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-[34px]">
          <div className="flex flex-col gap-2">
            <div>Top Revenue Client</div>
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
      <CardHeader className="pb-3">
        <CardTitle className="font-mono font-medium text-2xl">
          {data.customerName}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-[34px]">
        <div className="flex flex-col gap-2">
          <div>Top Revenue Client</div>
          <div className="text-sm text-muted-foreground">
            <FormatAmount
              amount={data.totalRevenue}
              currency={data.currency || team?.baseCurrency || "USD"}
              locale={user?.locale ?? undefined}
            />{" "}
            from {data.invoiceCount} invoice{data.invoiceCount !== 1 ? "s" : ""}{" "}
            past 30 days
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
