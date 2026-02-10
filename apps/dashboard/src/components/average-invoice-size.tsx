"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { FormatAmount } from "./format-amount";

export function AverageInvoiceSize() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const { data: user } = useUserQuery();
  const { data } = useSuspenseQuery(
    trpc.invoice.averageInvoiceSize.queryOptions(),
  );

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-medium text-2xl font-serif">$0</CardTitle>
        </CardHeader>

        <CardContent className="pb-[34px]">
          <div className="flex flex-col gap-2">
            <div>Average Invoice Size</div>
            <div className="text-sm text-muted-foreground">
              No invoices sent this month
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If multiple currencies, show the primary one or the first one
  const primaryData = data[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-medium text-2xl">
          <FormatAmount
            amount={primaryData?.averageAmount ?? 0}
            currency={primaryData?.currency || team?.baseCurrency || "USD"}
            locale={user?.locale ?? undefined}
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-[34px]">
        <div className="flex flex-col gap-2">
          <div>Average Invoice Size</div>
          <div className="text-sm text-muted-foreground">
            Based on invoices sent this month
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
