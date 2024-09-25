import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Charts } from "@/components/charts/charts";
import { EmptyState } from "@/components/charts/empty-state";
import TabbedCharts from "@/components/charts/tabbed-charts";
import { OverviewModal } from "@/components/modals/overview-modal";
import { CategorySpendingPortalView } from "@/components/portal-views/category-spending-portal-view";
import { FinancialPortalView } from "@/components/portal-views/financial-portal-view";
import { RecentFilesPortalView } from "@/components/portal-views/recent-files-portal-view";
import RecentTransactions from "@/components/recent-transactions";
import { Widgets } from "@/components/widgets";
import { Cookies } from "@/utils/constants";
import {
  getBankConnectionsByTeamId,
  getTeamBankAccounts,
  getUser,
} from "@midday/supabase/cached-queries";
import { RecurringTransactionFrequency } from "@midday/supabase/queries";
import { Card } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
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
  const [user, accounts, bankConnections] = await Promise.all([
    getUser(),
    getTeamBankAccounts(),
    getBankConnectionsByTeamId(),
  ]);

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

  const tier = user?.data?.tier ?? "free";

  return (
    <>
      {/** financial portal view */}
      <FinancialPortalView
        disabled={isEmpty}
        tier={tier}
        bankAccounts={accounts?.data ?? []}
        bankConnections={bankConnections?.data ?? []}
        userName={user?.data?.full_name ?? ""}
      />

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
        <Card className="my-4 p-[2%]">
          <div className="mt-8">
            {isEmpty && <EmptyState />}

            <div className={cn(isEmpty && "blur-[8px] opacity-20")}>
              <CategorySpendingPortalView
                disabled={isEmpty}
                period={initialPeriod}
                currency={searchParams.currency ?? "USD"}
              />
            </div>
          </div>
        </Card>

        {/** display recent transactions */}
        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions">
            <RecentTransactions
              title="Recent Transactions"
              description="Most Recent Transactions Of Interest"
            />
          </TabsContent>
          <TabsContent value="recurring">
            <RecentTransactions
              title="Subscriptions"
              description="Most Recent Detected recurring transactions across your accounts"
              recurringTransactionFrequency={
                RecurringTransactionFrequency.MONTHLY
              }
            />
          </TabsContent>
        </Tabs>

        <RecentFilesPortalView disabled={isEmpty} />

        {/** tabbed charts with income and expense charts */}
        <TabbedCharts
          currency={searchParams.currency ?? "USD"}
          className="mt-8"
          disabled={isEmpty}
          tier={tier}
        />
        {/* 
        <Widgets
          initialPeriod={initialPeriod}
          disabled={isEmpty}
          searchParams={searchParams}
        /> */}

        {/* * recent transactions
        <Card className="mt-8 min-h-[530px] overflow-y-auto scrollbar-hide">
          {isEmpty && <EmptyState />}
          <div className={`${isEmpty && "blur-[8px] opacity-20 relative"}`}>
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
          </div>
        </Card> */}
      </div>

      <OverviewModal defaultOpen={isEmpty && !hideConnectFlow} />
    </>
  );
}
