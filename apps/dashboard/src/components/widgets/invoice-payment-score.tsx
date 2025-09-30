"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PaymentScoreVisualizer } from "../payment-score-visualizer";
import { BaseWidget } from "./base";

export function InvoicePaymentScoreWidget() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.invoice.paymentStatus.queryOptions());
  const t = useI18n();
  const router = useRouter();

  const scorePercentage = data?.score ?? 0;

  const handleViewInvoices = () => {
    router.push("/invoices");
  };

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
      actions="View invoices"
      onClick={handleViewInvoices}
    />
  );
}
