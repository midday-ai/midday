import { CashflowCharts } from "@/components/charts/cashflow-charts";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { Inbox } from "@/components/inbox";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Cookies } from "@/utils/constants";
import { uniqueCurrencies } from "@midday/location/src/currencies";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { Card } from "@midday/ui/card";
import { ConnectedAccountSummary } from "@midday/ui/portal/connected-account-view";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Cash Flow | Midday",
};

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function CashFlowPage({ searchParams }: Props) {
  const user = await getUser();

  return (
    <Suspense fallback={<InboxViewSkeleton ascending />}>
      <ConnectAccountServerWrapper>
        <div className="py-[2%]">
          <ConnectedAccountSummary
            name={user?.data?.full_name ?? "Solomon AI User"}
          />
        </div>
        <CashflowCharts
          currency={(searchParams.currency as string) ?? "USD"}
          disableAllCharts={true}
        />
      </ConnectAccountServerWrapper>
    </Suspense>
  );
}
