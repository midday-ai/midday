import CardWrapper from "@/components/card/card-wrapper";
import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Charts } from "@/components/charts/charts";
import { EmptyState } from "@/components/charts/empty-state";
import TabbedCharts from "@/components/charts/tabbed-charts";
import { Transactions } from "@/components/charts/transactions";
import { OverviewModal } from "@/components/modals/overview-modal";
import { FinancialPortalView } from "@/components/portal-views/financial-portal-view";
import { Table } from "@/components/tables/transactions";
import { Widgets } from "@/components/widgets";
import { Cookies } from "@/utils/constants";
import { getTeamBankAccounts } from "@midday/supabase/cached-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { AreaChart } from "@midday/ui/charts/base/area-chart";
import { cn } from "@midday/ui/cn";
import { FinancialPortalOverview } from "@midday/ui/portal/financial-portal-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { columns, DataTable } from "@midday/ui/transaction-table";
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

export default async function Overview({
  searchParams,
}: { searchParams: Record<string, string> }) {
  const accounts = await getTeamBankAccounts();
  const chartType = cookies().get(Cookies.ChartType)?.value ?? "profit";

  const hideConnectFlow = cookies().has(Cookies.HideConnectFlow);
  const initialPeriod = cookies().has(Cookies.SpendingPeriod)
    ? JSON.parse(cookies().get(Cookies.SpendingPeriod)?.value ?? "{}")
    : {
        id: "this_year",
        from: startOfYear(new Date()).toISOString(),
        to: new Date().toISOString(),
      };

  const value = {
    ...(searchParams.from && { from: searchParams.from }),
    ...(searchParams.to && { to: searchParams.to }),
  };

  const isEmpty = !accounts?.data?.length;

  return (
    <>
      {/** financial portal view */}
      <FinancialPortalView />

      <div>
        <Card className="h-[530px] md:h-[700px] my-4 p-[2%]">
          <ChartSelectors defaultValue={defaultValue} />

          <div className="mt-8 relative">
            {isEmpty && <EmptyState />}

            <div className={cn(isEmpty && "blur-[8px] opacity-20")}>
              <Charts
                value={value}
                defaultValue={defaultValue}
                disabled={isEmpty}
                type={chartType}
                currency={searchParams.currency}
              />
            </div>
          </div>
        </Card>

        <Card className="mt-8 min-h-[530px] overflow-y-auto scrollbar-hide">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Transactions </CardTitle>
            <CardDescription className="text-md">
              View all recent transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-[2%]">
            <Table
              filter={{
                start: subMonths(new Date(), 1).toISOString(),
                end: new Date().toISOString(),
              }}
              page={0}
              sort={["date", "desc"]}
              query={null}
            />
          </CardContent>
        </Card>

        {/** tabbed charts with income and expense charts */}
        <TabbedCharts
          currency={searchParams.currency ?? "USD"}
          className="mt-8"
        />

        <Widgets
          initialPeriod={initialPeriod}
          disabled={isEmpty}
          searchParams={searchParams}
        />
      </div>

      <OverviewModal defaultOpen={isEmpty && !hideConnectFlow} />
    </>
  );
}
