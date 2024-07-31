import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Charts } from "@/components/charts/charts";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Widgets } from "@/components/widgets";
import { Cookies } from "@/utils/constants";
import {
  getBankAccountsCurrencies,
  getTeamBankAccounts,
} from "@midday/supabase/cached-queries";
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
  const accounts = await getTeamBankAccounts();
  const chartType = cookies().get(Cookies.ChartType)?.value ?? "profit";

  const currency = cookies().has(Cookies.ChartCurrency)
    ? cookies().get(Cookies.ChartCurrency)?.value
    : (await getBankAccountsCurrencies())?.data?.at(0)?.currency || "USD";

  const initialPeriod = cookies().has(Cookies.SpendingPeriod)
    ? JSON.parse(cookies().get(Cookies.SpendingPeriod)?.value)
    : {
        id: "this_year",
        from: startOfMonth(new Date()).toISOString(),
        to: new Date().toISOString(),
      };

  const value = {
    ...(searchParams.from && { from: searchParams.from }),
    ...(searchParams.to && { to: searchParams.to }),
    period: searchParams.period,
  };

  // NOTE: error is when a user cancel gocardless authentication
  const isOpen = Boolean(searchParams.step) && !searchParams.error;

  const empty =
    !accounts?.data?.length ||
    (Boolean(searchParams.error) && Boolean(searchParams.step));

  return (
    <>
      <div className={cn(empty && !isOpen && "opacity-20 pointer-events-none")}>
        <div className="h-[520px]">
          <ChartSelectors defaultValue={defaultValue} currency={currency} />
          <Charts
            value={value}
            defaultValue={defaultValue}
            disabled={empty}
            currency={currency}
            type={chartType}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            throw new Error("Sentry Frontend Error");
          }}
        >
          Throw error
        </button>

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
