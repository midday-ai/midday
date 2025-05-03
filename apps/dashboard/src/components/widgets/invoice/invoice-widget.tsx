"use client";

import { PaymentScoreVisualizer } from "@/components/payment-score-visualizer";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Invoice } from "./invoice";

export function InvoiceWidget() {
  const trpc = useTRPC();
  const t = useI18n();

  const { data: invoices } = useSuspenseQuery(
    trpc.invoice.get.queryOptions({ pageSize: 10 }),
  );

  const { data: paymentStatus } = useSuspenseQuery(
    trpc.invoice.paymentStatus.queryOptions(),
  );

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center p-3 py-2 border border-border">
        <div>
          <div className="flex flex-col gap-2">
            <div>{t(`payment_status.${paymentStatus?.payment_status}`)}</div>
            <div className="text-sm text-muted-foreground">Payment score</div>
          </div>
        </div>

        <PaymentScoreVisualizer
          score={paymentStatus?.score ?? 0}
          paymentStatus={paymentStatus?.payment_status ?? "none"}
        />
      </div>

      <Invoice invoices={invoices?.data ?? []} />
    </div>
  );
}
