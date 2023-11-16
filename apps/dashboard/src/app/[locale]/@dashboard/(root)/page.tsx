import { Chart } from "@/components/charts/chart";
import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Realtime } from "@/components/charts/realtime";
import { Spending } from "@/components/charts/spending";
import { Transactions } from "@/components/charts/transactions";
import { OverviewModal } from "@/components/modals/overview-modal";
import {
  getBankConnectionsByTeamId,
  getUser,
} from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/utils";
import { startOfMonth, startOfYear } from "date-fns";
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
  const { data } = await getBankConnectionsByTeamId();

  const value = {
    ...(searchParams.from && { from: searchParams.from }),
    ...(searchParams.to && { to: searchParams.to }),
    period: searchParams.period,
  };

  const isOpen = Boolean(searchParams.step);
  const empty = !data?.length && !isOpen;

  return (
    <>
      <div className={cn(empty && "opacity-20 pointer-events-none")}>
        <div className="h-[450px]">
          <ChartSelectors value={value} defaultValue={defaultValue} />

          <Suspense>
            <Chart value={value} defaultValue={defaultValue} disabled={empty} />
          </Suspense>
        </div>

        <div className="flex space-x-8 mt-14">
          <Spending disabled={empty} />
          <Transactions disabled={empty} />
        </div>

        <Realtime teamId={userData.team_id} />
      </div>
      {!isOpen && empty && <OverviewModal />}
    </>
  );
}
