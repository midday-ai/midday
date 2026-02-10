"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function MostActiveClient() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.invoice.mostActiveClient.queryOptions(),
  );

  if (!data) {
    return (
      <Card className="hidden sm:block">
        <CardHeader className="pb-2">
          <CardTitle className="font-medium text-2xl font-serif">
            No Active Client
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-5">
          <div className="flex flex-col gap-2">
            <div>Most Active Client</div>
            <div className="text-sm text-muted-foreground">
              No client activity past 30 days
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trackerHours = Math.round(data.totalTrackerTime / 3600);
  const trackerMinutes = Math.round((data.totalTrackerTime % 3600) / 60);

  const timeDisplay =
    trackerHours > 0
      ? `${trackerHours}h${trackerMinutes > 0 ? ` ${trackerMinutes}m` : ""}`
      : `${trackerMinutes}m`;

  return (
    <Card className="hidden sm:block">
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-2xl font-serif">
          {data.customerName}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-5">
        <div className="flex flex-col gap-2">
          <div>Most Active Client</div>
          <div className="text-sm text-muted-foreground">
            {data.totalTrackerTime > 0 && (
              <>
                {timeDisplay} tracked
                {data.invoiceCount > 0 && " and "}
              </>
            )}
            {data.invoiceCount > 0 && (
              <>
                {data.invoiceCount} invoice{data.invoiceCount !== 1 ? "s" : ""}
              </>
            )}
            {" past 30 days"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
