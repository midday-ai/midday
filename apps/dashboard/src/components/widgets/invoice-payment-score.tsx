"use client";

import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { PaymentScoreVisualizer } from "../payment-score-visualizer";
import { BaseWidget } from "./base";
import { WidgetSkeleton } from "./widget-skeleton";

export function InvoicePaymentScoreWidget() {
  const trpc = useTRPC();
  const t = useI18n();
  const { data, isLoading } = useQuery(
    trpc.invoice.paymentStatus.queryOptions(),
  );

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Payment Score"
        icon={<Icons.Invoice className="size-4" />}
        descriptionLines={2}
      />
    );
  }

  const scorePercentage = data?.score ?? 0;

  return (
    <BaseWidget
      title="Payment Score"
      description={
        <div>
          <h2 className="text-sm text-[#666] mb-4">
            {data?.paymentStatus
              ? // @ts-expect-error
                t(`payment_status_description.${data?.paymentStatus}`)
              : "No payment history yet"}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <PaymentScoreVisualizer score={scorePercentage} />
            </div>
          </div>
        </div>
      }
      icon={<Icons.Invoice className="size-4" />}
    />
  );
}
