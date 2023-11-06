import { startOfYear } from "date-fns";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ErrorFallback } from "../error-fallback";
import { SpendingList } from "./spending-list";
import { SpendingPeriod } from "./spending-period";

export async function Spending() {
  const initialPeriod = cookies().has("spending-period")
    ? JSON.parse(cookies().get("spending-period")?.value)
    : {
        id: "this_month",
        from: startOfYear(new Date()).toISOString(),
        to: new Date().toISOString(),
      };

  return (
    <div className="flex-1 border p-8 relative">
      <SpendingPeriod initialPeriod={initialPeriod} />

      <div className="h-[350px]">
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense>
            <SpendingList initialPeriod={initialPeriod} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
