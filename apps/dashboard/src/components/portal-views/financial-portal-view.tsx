"use client";

import { default as features } from "@/config/enabled-features";
import { isFreeТier, Tier } from "@/config/tier";
import { Tables } from "@midday/supabase/types";
import { Card } from "@midday/ui/card";
import { FinancialPortalOverview } from "@midday/ui/portal/financial-portal-view";
import { HTMLAttributes, useMemo } from "react";
import { BankAccountOverview } from "../bank-account/bank-account-overview";
import { useStore } from "@/hooks/use-store";
import { useUserStore } from "@/store/backend";

type BankAccount = Tables<"bank_accounts">;
type BankConnection = Tables<"bank_connections">;

interface FinancialPortalViewProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  tier: Tier;
  bankAccounts?: Array<BankAccount>;
  bankConnections?: Array<BankConnection>;
  userName: string;
  userId: string;
  title?: string;
  description?: string;
}

export const FinancialPortalView: React.FC<FinancialPortalViewProps> = ({
  disabled,
  tier,
  bankAccounts,
  bankConnections,
  userName,
  userId,
  title,
  description,
  ...props
}): JSX.Element | null => {
  const { userFinancialContext, userFinancialProfile } = useUserStore();

  // Return null if analytics v2 is not enabled
  if (!features.isAnalyticsV2Enabled) return null;

  // based on the tier we disclose a different amount of information
  const isCurrentUserTierFree = isFreeТier(tier);
  // get the number of bank accounts
  const hasBankAccounts = bankAccounts && bankAccounts.length > 0;

  // Create a hash map of bank connection id to bank connection
  const bankConnectionMap = useMemo(() => {
    return (bankConnections || []).reduce(
      (acc, connection) => {
        acc[connection.id] = connection;
        return acc;
      },
      {} as Record<string, BankConnection>,
    );
  }, [bankConnections]);

  if (isCurrentUserTierFree && hasBankAccounts) {
    return (
      <div className="w-full pt-[3%] mx-auto">
        <Card className="p-[2%]">
          <FinancialPortalOverview
            baseTierNumberOfConnectedAccounts={bankConnections?.length ?? 0}
            isFreeTier={true}
            title={title}
            description={description}
          />
          <BankAccountOverview
            bankAccounts={bankAccounts}
            bankConnectionMap={bankConnectionMap}
            userName={userName}
            userId={userId}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full pt-[3%] mx-auto">
      <Card className="p-[2%]">
        <div className={`mt-8 relative`}>
          <div
            className={`${(disabled || isCurrentUserTierFree) && "blur-[8px] opacity-20"}`}
          >
            <FinancialPortalOverview
              financialProfile={userFinancialProfile}
              financialContext={userFinancialContext}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
