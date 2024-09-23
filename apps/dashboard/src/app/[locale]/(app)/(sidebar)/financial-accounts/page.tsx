import { EmptyState } from "@/components/charts/empty-state";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { UpgradeTier } from "@/components/upgrade-tier";
import Tier, { isFreeТier } from "@/config/tier";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/cn";
import { BankAccountsOverviewSummary } from "@midday/ui/portal/bank-account-portal-view";
import { ConnectedAccountSummary } from "@midday/ui/portal/connected-account-view";
import { CreditAccountsOverviewSummary } from "@midday/ui/portal/credit-account-portal-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Financial Accounts | Midday",
};

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function FinancialAccountsPage({ searchParams }: Props) {
  const user = await getUser();
  const accounts = await getTeamBankAccounts();
  const isEmpty = !accounts?.data?.length;

  // TODO: get the tier from the user record
  const tier: Tier = user?.data?.tier ?? "free";
  // based on the tier we disclose a different amount of information
  const isCurrentUserTierFree = isFreeТier(tier);

  return (
    <Suspense fallback={<InboxViewSkeleton ascending />}>
      <ConnectAccountServerWrapper>
        <div className={cn((isEmpty || isCurrentUserTierFree) && "mt-8 relative")}>
          {isEmpty && <EmptyState />}
          {isCurrentUserTierFree && <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />}

          <div className={cn("py-[2%]", (isEmpty || isCurrentUserTierFree) && "blur-[8px] opacity-20")}>
            <ConnectedAccountSummary
              name={user?.data?.full_name ?? "Solomon AI User"}
            />
          </div>
        </div>

        {/** we display the connected accounts here */}
        <div className={cn((isEmpty || isCurrentUserTierFree) && "mt-8 relative")}>
          {isEmpty && <EmptyState />}
          {isCurrentUserTierFree && <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />}

          <Tabs
            defaultValue="bank-accounts"
            className={cn((isEmpty || isCurrentUserTierFree) && "blur-[8px] opacity-20")}
          >
            <TabsList>
              <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
              <TabsTrigger value="credit-cards">Credit Cards</TabsTrigger>
            </TabsList>
            <TabsContent value="bank-accounts">
              <BankAccountsOverviewSummary
                financialProfile={undefined}
                financialContext={undefined}
                demoMode={true}
              />
            </TabsContent>
            <TabsContent value="credit-cards">
              <CreditAccountsOverviewSummary
                financialProfile={undefined}
                financialContext={undefined}
                demoMode={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </ConnectAccountServerWrapper>
    </Suspense>
  );
}
