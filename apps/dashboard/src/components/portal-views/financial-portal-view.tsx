"use client";

import features from "@/config/enabled-features";
import Tier, { isFreeТier } from "@/config/tier";
import { Tables } from "@midday/supabase/types";
import { Card } from "@midday/ui/card";
import { FinancialPortalOverview } from "@midday/ui/portal/financial-portal-view";
import { HTMLAttributes } from "react";
import { BankAccount } from '../bank-account';
import { EmptyState } from "../charts/empty-state";
import { MettalicCard } from "../mettalic-card";
import { UpgradeTier } from "../upgrade-tier";


type BankAccount = Tables<"bank_accounts">;

interface FinancialPortalViewProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  tier: Tier;
  bankAccounts?: Array<BankAccount>
  userName: string;
}

/**
 * FinancialPortalView Component
 *
 * This component renders a financial portal overview if the Analytics V2 feature is enabled.
 * It uses the Card component to wrap the FinancialPortalOverview.
 *
 * @returns {JSX.Element | null} Returns the FinancialPortalOverview wrapped in a Card if Analytics V2 is enabled, otherwise returns null.
 */
export const FinancialPortalView: React.FC<FinancialPortalViewProps> = ({
  disabled,
  tier,
  bankAccounts,
  userName,
  ...props
}): JSX.Element | null => {
  // Return null if analytics v2 is not enabled
  if (!features.isAnalyticsV2Enabled) return null;

  // based on the tier we disclose a different amount of information
  const isCurrentUserTierFree = isFreeТier(tier);
  // get the number of bank accounts
  const hasBankAccounts = bankAccounts && bankAccounts.length > 0;

  if (isCurrentUserTierFree && hasBankAccounts) {
    return (
      <div className="w-full pt-[3%] mx-auto">
        <Card className="p-[2%]">
          <FinancialPortalOverview baseTierNumberOfConnectedAccounts={bankAccounts.length} isFreeTier={true} />
          {/** iterater over bank accounts and render a card for each */}
          <div className="flex flex-1 flex-wrap gap-3 p-[2%]">
          {bankAccounts.map((bankAccount) => (
            <MettalicCard key={bankAccount.id} cardIssuer={bankAccount.name ?? "Bank Account"} cardHolderName={userName ?? "User Name"} cardNumber={bankAccount.type ?? "xxxx"} logoSrc={""} />
          ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full pt-[3%] mx-auto">
      <Card className="p-[2%]">
        <div className={`mt-8 relative`}>
          {disabled && <EmptyState />}
          {(isCurrentUserTierFree || !hasBankAccounts) && <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />}
          <div className={`${(disabled || isCurrentUserTierFree) && "blur-[8px] opacity-20"}`}>
            <FinancialPortalOverview
              financialProfile={undefined}
              financialContext={undefined}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
