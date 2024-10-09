import { PaymentScoreVisualizer } from "@/components/payment-score-visualizer";
import { getI18n } from "@/locales/server";
import { getPaymentStatus, getUser } from "@midday/supabase/cached-queries";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { Invoice } from "./invoice";

export function InvoiceWidgetSkeleton() {
  return null;
}

export function InvoiceWidgetHeader() {
  return (
    <div className="flex justify-between items-center">
      <Link href="/invoices" prefetch>
        <h2 className="text-lg">Invoices</h2>
      </Link>

      <Button variant="outline" size="icon">
        <Icons.Add />
      </Button>
    </div>
  );
}

export async function InvoiceWidget() {
  const t = await getI18n();
  const {
    data: { payment_status, score },
  } = await getPaymentStatus();

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

      <Invoice />
    </div>
  );
}
