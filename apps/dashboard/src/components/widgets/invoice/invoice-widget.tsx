import { PaymentScoreVisualizer } from "@/components/payment-score-visualizer";
import { getI18n } from "@/locales/server";
import { getInvoices, getPaymentStatus } from "@midday/supabase/cached-queries";
import { Invoice } from "./invoice";

export function InvoiceWidgetSkeleton() {
  return null;
}

export async function InvoiceWidget() {
  const t = await getI18n();
  const {
    data: { payment_status, score },
  } = await getPaymentStatus();

  const { data: invoices } = await getInvoices();

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
