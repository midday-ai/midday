import { Chart } from "@/components/charts/chart";
import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Spending } from "@/components/charts/spending";
import { Transactions } from "@/components/charts/transactions";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Cookies } from "@/utils/constants";
import { getBankConnectionsByTeamId } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/utils";
import { startOfMonth, subMonths } from "date-fns";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

const defaultValue = {
  from: subMonths(startOfMonth(new Date()), 12).toISOString(),
  to: new Date().toISOString(),
  period: "monthly",
};

export default async function Overview({ searchParams }) {
  const bankConnections = await getBankConnectionsByTeamId();
  const chartPeriod = cookies().has(Cookies.ChartPeriod)
    ? JSON.parse(cookies().get(Cookies.ChartPeriod)?.value)
    : {};

  const value = {
    ...chartPeriod,
    ...(searchParams.from && { from: searchParams.from }),
    ...(searchParams.to && { to: searchParams.to }),
    period: searchParams.period,
  };

  // NOTE: error is when a user cancel gocardless authentication
  const isOpen = Boolean(searchParams.step) && !searchParams.error;

  const empty =
    !bankConnections?.data?.length ||
    (Boolean(searchParams.error) && Boolean(searchParams.step));

  return (
    <>
      <div className={cn(empty && !isOpen && "opacity-20 pointer-events-none")}>
        <div className="h-[450px]">
          <ChartSelectors defaultValue={defaultValue} />

          <Suspense>
            <Chart value={value} defaultValue={defaultValue} disabled={empty} />
          </Suspense>
        </div>

        <div className="flex space-x-8 mt-14">
          <Spending disabled={empty} />
          <Transactions disabled={empty} />
        </div>
      </div>
      {!isOpen && empty && <OverviewModal />}
    </>
  );
}
