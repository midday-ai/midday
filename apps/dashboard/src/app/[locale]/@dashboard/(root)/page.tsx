import { Katt } from "@/components/charts/katt";
import { SelectPeriod } from "@/components/charts/select-period";
import { Spending } from "@/components/charts/spending";
import { Summary } from "@/components/charts/summary";
import { Transactions } from "@/components/charts/transactions";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  return (
    <div>
      <div className="flex justify-between mt-6">
        <Summary />
        <SelectPeriod />
      </div>

      <div className="h-[280px]">
        <Suspense>
          <Katt />
        </Suspense>
      </div>

      <div className="flex space-x-8 mt-14">
        <Spending />
        <Transactions />
      </div>
    </div>
  );
}
