/**
 * @fileoverview Financial Accounts Page Component
 *
 * This file contains the FinancialAccountsPage component, which renders the financial accounts
 * overview for a user in the application.
 *
 * @module FinancialAccountsPage
 */

import BankAccountSingleView from "@/components/bank-account/bank-account-single-view";
import { BankAccountOverviewProTier } from "@/components/bank-account/bank-account-summary-details";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { FinancialPortalView } from "@/components/portal-views/financial-portal-view";
import config from "@/config";
import Tier, { isFreeТier } from "@/config/tier";
import {
  getBankConnectionsByTeamId,
  getTeamBankAccounts,
  getUser,
} from "@midday/supabase/cached-queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import type { Metadata } from "next";
import { Suspense } from "react";

/**
 * Metadata for the Financial Accounts page
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: `Financial Accounts | ${config.company}`,
};

/**
 * Props for the FinancialAccountsPage component
 * @typedef {Object} Props
 * @property {Object} searchParams - URL search parameters
 */
type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

/**
 * FinancialAccountsPage Component
 *
 * This component displays an overview of a user's financial accounts, including bank accounts
 * and credit cards. It handles different states based on the user's tier and account status.
 *
 * @async
 * @function FinancialAccountsPage
 * @param {Props} props - Component props
 * @returns {Promise<JSX.Element>} Rendered component
 */
export default async function FinancialAccountsPage({ searchParams }: Props) {
  const [user, accounts, bankConnections] = await Promise.all([
    getUser(),
    getTeamBankAccounts(),
    getBankConnectionsByTeamId(),
  ]);

  const isEmpty = !accounts?.data?.length;

  const tier: Tier = user?.data?.tier ?? "free";
  // based on the tier we disclose a different amount of information
  const isCurrentUserTierFree = isFreeТier(tier);

  return (
    <Suspense fallback={<InboxViewSkeleton ascending />}>
      <ConnectAccountServerWrapper>
        <FinancialPortalView
          disabled={isEmpty}
          tier={tier}
          bankAccounts={accounts?.data ?? []}
          bankConnections={bankConnections?.data ?? []}
          userName={user?.data?.full_name ?? ""}
          title="Connected Bank Accounts"
          description="View your connected bank accounts and manage them."
        />
        {/** place a selector here to switch between bank accounts */}
        <div className="py-[2%]">
          <Tabs defaultValue={accounts?.data?.[0]?.id}>
            <TabsList>
              {accounts?.data?.map((account) => (
                <TabsTrigger key={account.id} value={account.id}>
                  {account.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {accounts?.data?.map((account) => (
              <TabsContent key={account.id} value={account.id}>
                <BankAccountSingleView
                  bankAccount={account}
                  bankConnections={bankConnections?.data ?? []}
                  userName={user?.data?.full_name ?? ""}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/** bank account single view */}
        <BankAccountOverviewProTier
          user={user}
          isEmpty={isEmpty}
          isCurrentUserTierFree={isCurrentUserTierFree}
          tier={tier}
        />
      </ConnectAccountServerWrapper>
    </Suspense>
  );
}
