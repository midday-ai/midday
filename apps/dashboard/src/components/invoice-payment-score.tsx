import { getI18n } from "@/locales/server";
import { getPaymentStatus } from "@midday/supabase/cached-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
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

export async function InvoicePaymentScore() {
  const t = await getI18n();
  const {
    data: { payment_status, score },
  } = await getPaymentStatus();

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-col xl:flex-row justify-between">
        <CardTitle className="font-mono font-medium text-2xl">
          {t(`payment_status.${payment_status}`)}
        </CardTitle>

        <PaymentScoreVisualizer score={score} paymentStatus={payment_status} />
      </CardHeader>

      <CardContent className="sm:hidden xl:flex">
        <div className="flex flex-col gap-2">
          <div>Payment score</div>
          <div className="text-sm text-muted-foreground">
            {t(`payment_status_description.${payment_status}`)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
