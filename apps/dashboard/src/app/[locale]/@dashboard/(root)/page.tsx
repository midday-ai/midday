import { Chart } from "@/components/charts/chart";
import { LatestTransactions } from "@/components/charts/latest-transactions";
import { Period } from "@/components/charts/period";
import { Spending } from "@/components/charts/spending";
import { Summary } from "@/components/charts/summary";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  return (
    <div>
      <Period className="mt-6 mb-8" />
      <Summary />

      <Suspense>
        <Chart />
      </Suspense>

      <div className="flex space-x-8 mt-14">
        <Spending />
        <LatestTransactions />
      </div>
    </div>
  );
}
