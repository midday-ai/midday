"use client";

import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense, useState } from "react";
import { SpendingListSkeleton } from "./skeleton";
import { SpendingList } from "./spending-list";
import { SpendingPeriod } from "./spending-period";

type Props = {
  disabled: boolean;
};

export function Spending({ disabled }: Props) {
  const [period, setPeriod] = useState("last_30d");

  return (
    <div className="border aspect-square relative overflow-hidden">
      <div className="p-4 md:p-8 flex-col">
        <SpendingPeriod period={period} onChange={setPeriod} />

        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<SpendingListSkeleton />}>
            <SpendingList disabled={disabled} period={period} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
