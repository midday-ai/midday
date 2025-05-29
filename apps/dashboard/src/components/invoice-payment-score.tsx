"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PaymentScoreVisualizer } from "./payment-score-visualizer";

export function InvoicePaymentScoreSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row justify-between">
        <CardTitle>
          <Skeleton className="h-8 w-32" />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function InvoicePaymentScore() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.invoice.paymentStatus.queryOptions());
  const t = useI18n();

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-col xl:flex-row justify-between">
        <CardTitle className="font-mono font-medium text-2xl">
          {/* @ts-expect-error */}
          {t(`payment_status.${data?.paymentStatus}`)}
        </CardTitle>

        <PaymentScoreVisualizer
          score={data?.score}
          paymentStatus={data?.paymentStatus}
        />
      </CardHeader>

      <CardContent className="sm:hidden xl:flex">
        <div className="flex flex-col gap-2">
          <div>Payment score</div>
          <div className="text-sm text-muted-foreground">
            {/* @ts-expect-error */}
            {t(`payment_status_description.${data?.paymentStatus}`)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
