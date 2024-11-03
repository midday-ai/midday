import { PaymentScoreVisualizer } from "@/components/payment-score-visualizer";
import { getI18n } from "@/locales/server";
import { getInvoices, getPaymentStatus } from "@midday/supabase/cached-queries";
import { Skeleton } from "@midday/ui/skeleton";
import { Invoice } from "./invoice";
import { InvoiceRowSkeleton } from "./invoice-row";

export function InvoiceWidgetSkeleton() {
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center p-3 py-2 border border-border">
        <div className="w-1/2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <InvoiceRowSkeleton key={index.toString()} />
        ))}
      </div>
    </div>
  );
}

export async function InvoiceWidget() {
  const [t, { data: paymentStatusData }, { data: invoicesData }] =
    await Promise.all([getI18n(), getPaymentStatus(), getInvoices()]);

  const { payment_status, score } = paymentStatusData ?? {};
  const invoices = invoicesData ?? [];

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center p-3 py-2 border border-border">
        <div>
          <div className="flex flex-col gap-2">
            <div>{t(`payment_status.${payment_status}`)}</div>
            <div className="text-sm text-muted-foreground">Payment score</div>
          </div>
        </div>
        <PaymentScoreVisualizer score={score} paymentStatus={payment_status} />
      </div>

      <Invoice invoices={invoices} />
    </div>
  );
}
