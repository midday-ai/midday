import { Card } from "@midday/ui/card";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { ErrorFallback } from "../error-fallback";
import { LocationSpendingList } from "./location-spending-list";
import { MerchantSpendingList } from "./merchant-spending-list";
import { SpendingList, SpendingListSkeleton } from "./spending-list";
import { SpendingPeriod } from "./spending-period";
import { PaymentChannelSpendingList } from "./payment-channel-spending-list";

export async function Spending({
  disabled,
  initialPeriod,
  currency,
  spendingType = "category",
}: {
  disabled: boolean;
  initialPeriod: any;
  currency?: string;
  spendingType?: "category" | "merchant" | "location" | "payment_channel";
}) {
  return (
    <Card className="aspect-square relative overflow-hidden rounded-2xl">
      <div className="p-4 md:p-8 flex-col">
        <SpendingPeriod initialPeriod={initialPeriod} />

        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<SpendingListSkeleton />} key={initialPeriod}>
            {spendingType === "category" ? (
              <SpendingList
                initialPeriod={initialPeriod}
              disabled={disabled}
                currency={currency}
              />
            ) : spendingType === "merchant" ? (
              <MerchantSpendingList
                initialPeriod={initialPeriod}
                disabled={disabled}
                currency={currency}
              />
            ) : spendingType === "location" ? (
              <LocationSpendingList
                initialPeriod={initialPeriod}
                disabled={disabled}
                currency={currency}
              />
            ) : spendingType === "payment_channel" ? (
              <PaymentChannelSpendingList
                initialPeriod={initialPeriod}
                disabled={disabled}
                currency={currency}
              />
            ) : null}
          </Suspense>
        </ErrorBoundary>
      </div>
    </Card>
  );
}
