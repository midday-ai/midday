import { AccountSummarySection } from "@/components/cash-flow/account-summary-section";
import { ExpenseSection } from "@/components/cash-flow/expense-section";
import { IncomeSection } from "@/components/cash-flow/income-section";
import { CashflowCharts } from "@/components/charts/cashflow-charts";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import Tier from "@/config/tier";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/cn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { startOfMonth, subMonths } from "date-fns";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Cash Flow | Midday",
};

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

const defaultValue = {
  from: subMonths(startOfMonth(new Date()), 12).toISOString(),
  to: new Date().toISOString(),
  period: "monthly",
  type: "expense"
};

export default async function CashFlowPage({ searchParams }: Props) {
  const user = await getUser();
  const accounts = await getTeamBankAccounts();
  const isEmpty = !accounts?.data?.length;

  const tier: Tier = user?.data?.tier ?? "free";

  const value = {
    ...(searchParams.from && { from: searchParams.from }),
    ...(searchParams.to && { to: searchParams.to }),
  };

  return (
    <Suspense fallback={<InboxViewSkeleton ascending />}>
      <ConnectAccountServerWrapper>
        <div className="mt-8">
          <AccountSummarySection user={user} isEmpty={isEmpty} />
          <div className={cn("mt-4", isEmpty && "relative")}>
            <div className="flex flex-col gap-4">
              <ExpenseSection
                isEmpty={isEmpty}
                accounts={accounts}
                user={user}
                tier={tier}
                value={value}
                defaultValue={defaultValue}
              />
              <Tabs defaultValue="income">
                <TabsList>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="profit">Net Income</TabsTrigger>
                </TabsList>
                <TabsContent value="income">
                  <IncomeSection
                    isEmpty={isEmpty}
                    accounts={accounts}
                    user={user}
                    tier={tier}
                    value={value}
                    defaultValue={defaultValue}
                    description={`
                    Effective income management is the lifeblood of any evolving business venture, serving as a critical determinant of profitability and financial resilience. In today's dynamic market landscape, astute entrepreneurs recognize that meticulous oversight and strategic adjustment of income streams are not merely beneficial—they are imperative.
                  `}
                    type="income"
                  />
                </TabsContent>
                <TabsContent value="profit">
                  <IncomeSection
                    isEmpty={isEmpty}
                    accounts={accounts}
                    user={user}
                    tier={tier}
                    value={value}
                    defaultValue={defaultValue}
                    description={`
                    Effective income management is the lifeblood of any evolving business venture, serving as a critical determinant of profitability and financial resilience. In today's dynamic market landscape, astute entrepreneurs recognize that meticulous oversight and strategic adjustment of income streams are not merely beneficial—they are imperative.
                  `}
                    type="profit"
                  />
                </TabsContent>
              </Tabs>
            </div>
            <CashflowCharts
              currency={(searchParams.currency as string) ?? "USD"}
              disableAllCharts={true}
              tier={tier}
            />
          </div>
        </div>
      </ConnectAccountServerWrapper>
    </Suspense>
  );
}
