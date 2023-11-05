import { startOfYear } from "date-fns";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { SpendingList } from "./spending-list";
import { SpendingPeriod } from "./spending-period";

export async function Spending() {
  const initialPeriod = cookies().has("spending-period")
    ? JSON.parse(cookies().get("spending-period")?.value)
    : {
        from: startOfYear(new Date()).toISOString(),
        to: new Date().toISOString(),
      };

  return (
    <div className="flex-1 border p-8 relative">
      <SpendingPeriod initialPeriod={initialPeriod} />

      <div className="h-[350px]">
        <Suspense>
          <SpendingList initialPeriod={initialPeriod} />
        </Suspense>
      </div>
    </div>
  );
}
