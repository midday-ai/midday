import { Chart } from "@/components/charts/chart";
import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Spending } from "@/components/charts/spending";
import { Transactions } from "@/components/charts/transactions";
import { startOfMonth, startOfYear, subMonths } from "date-fns";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

const defaultRange = {
  from: startOfYear(startOfMonth(new Date())).toISOString(),
  to: new Date().toISOString(),
};

export default async function Overview({ searchParams }) {
  const range = {
    ...(searchParams.from && { from: searchParams.from }),
    ...(searchParams.to && { to: searchParams.to }),
  };

  return (
    <div>
      <div className="h-[450px]">
        <ChartSelectors range={range} defaultRange={defaultRange} />

        <Suspense>
          <Chart range={range} defaultRange={defaultRange} />
        </Suspense>
      </div>

      <div className="flex space-x-8 mt-14">
        <Spending />
        <Transactions />
      </div>
    </div>
  );
}
