import { AccountSummarySection } from "@/components/cash-flow/account-summary-section";
import { ExpenseTabsSection } from "@/components/cash-flow/expense-tabs-section";
import { IncomeTabsSection } from "@/components/cash-flow/income-tabs-section";
import { SpendingTabsSection } from "@/components/cash-flow/spending-tabs-section";
import { CashflowCharts } from "@/components/charts/cashflow-charts";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import Tier from "@/config/tier";
import { Cookies } from "@/utils/constants";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { startOfMonth, startOfYear, subMonths } from "date-fns";
import type { Metadata } from "next";
import { cookies } from "next/headers";
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
  const initialPeriod = cookies().has(Cookies.SpendingPeriod)
    ? JSON.parse(cookies().get(Cookies.SpendingPeriod)?.value ?? "{}")
    : {
      id: "this_year",
      from: startOfYear(new Date()).toISOString(),
      to: new Date().toISOString(),
    };

  const tier: Tier = user?.data?.tier ?? "free";

  const value = {
    ...(searchParams.from && { from: searchParams.from }),
    ...(searchParams.to && { to: searchParams.to }),
  };

  return (
    <Suspense fallback={<InboxViewSkeleton ascending />}>
      <ConnectAccountServerWrapper>
        <div className="mt-8">
          <AccountSummarySection user={user} isEmpty={isEmpty} tier={tier} name={user?.data?.full_name ?? "Solomon AI User"} />
          <div className="mt-4 flex flex-col gap-4">
            <ExpenseTabsSection
              isEmpty={isEmpty}
              accounts={accounts as any}
              user={user as any}
              tier={tier}
              value={value as any}
              defaultValue={defaultValue}
            />
            <IncomeTabsSection
              isEmpty={isEmpty}
              accounts={accounts as any}
              user={user as any}
              tier={tier}
              value={value as any}
              defaultValue={defaultValue}
            />
            <SpendingTabsSection
              isEmpty={isEmpty}
              initialPeriod={initialPeriod}
              currency={(searchParams.currency as string) ?? "USD"}
            />
          </div>
          <CashflowCharts
            currency={(searchParams.currency as string) ?? "USD"}
            disableAllCharts={true}
            tier={tier}
          />
        </div>
      </ConnectAccountServerWrapper>
    </Suspense>
  );
}
