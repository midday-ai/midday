import { Chart } from "@/components/charts/chart";
import { ChartSelectors } from "@/components/charts/chart-selectors";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Widgets } from "@/components/widgets";
import { Cookies } from "@/utils/constants";
import { getBankConnectionsByTeamId } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/cn";
import { startOfMonth, startOfYear, subMonths } from "date-fns";
import type { Metadata } from "next";
import { cookies } from "next/headers";

// NOTE: GoCardLess serverAction needs this currently
// (Fetch accounts takes up to 20s and default limit is 15s)
export const maxDuration = 30;

export const metadata: Metadata = {
  title: "Overview | Midday",
};

const defaultValue = {
  from: subMonths(startOfMonth(new Date()), 12).toISOString(),
  to: new Date().toISOString(),
  period: "monthly",
};

export default async function Overview({ searchParams }) {
  // TODO: Check if there are transactions instead
  const bankConnections = await getBankConnectionsByTeamId();
  const chartPeriod = cookies().has(Cookies.ChartPeriod)
    ? JSON.parse(cookies().get(Cookies.ChartPeriod)?.value)
    : {};

  const initialPeriod = cookies().has("spending-period")
    ? JSON.parse(cookies().get("spending-period")?.value)
    : {
        id: "this_month",
        from: startOfYear(new Date()).toISOString(),
        to: new Date().toISOString(),
      };

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
          <Chart value={value} defaultValue={defaultValue} disabled={empty} />
        </div>

        <Widgets
          initialPeriod={initialPeriod}
          disabled={empty}
          searchParams={searchParams}
        />
      </div>
      {!isOpen && empty && <OverviewModal />}
    </>
  );
}
