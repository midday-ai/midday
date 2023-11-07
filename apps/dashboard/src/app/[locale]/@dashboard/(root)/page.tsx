import { Chart } from "@/components/charts/chart";
import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Realtime } from "@/components/charts/realtime";
import { Spending } from "@/components/charts/spending";
import { Transactions } from "@/components/charts/transactions";
import { getUser } from "@midday/supabase/cached-queries";
import { startOfMonth, startOfYear, subMonths } from "date-fns";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

const defaultValue = {
  from: startOfYear(startOfMonth(new Date())).toISOString(),
  to: new Date().toISOString(),
  period: "monthly",
};

export default async function Overview({ searchParams }) {
  const { data: userData } = await getUser();
  const value = {
    ...(searchParams.from && { from: searchParams.from }),
    ...(searchParams.to && { to: searchParams.to }),
    period: searchParams.period,
  };

  return (
    <div>
      <div className="h-[450px]">
        <ChartSelectors value={value} defaultValue={defaultValue} />

        <Suspense>
          <Chart value={value} defaultValue={defaultValue} />
        </Suspense>
      </div>

      <div className="flex space-x-8 mt-14">
        <Spending />
        <Transactions />
      </div>

      <Realtime teamId={userData.team_id} />
    </div>
  );
}
