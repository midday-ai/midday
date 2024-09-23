"use client";

import React from "react";
import { FinancialUserProfile, MelodyFinancialContext } from "client-typescript-sdk";
import { useFinancialData } from "./hooks/useFinancialData";
import { PortalHeader } from "./components/PortalHeader";
import { LinkedAccountsOverview } from "./components/LinkedAccountsOverview";
import { StatsOverview } from "./components/StatsOverview";
import { FreeTierView } from "./components/FreeTierView";

interface FinancialPortalOverviewProps {
  financialProfile?: FinancialUserProfile;
  financialContext?: MelodyFinancialContext;
  demoMode?: boolean;
  baseTierNumberOfConnectedAccounts?: number;
  isFreeTier?: boolean;
}

export const FinancialPortalOverview: React.FC<FinancialPortalOverviewProps> = ({
  financialProfile,
  financialContext,
  demoMode = false,
  baseTierNumberOfConnectedAccounts = 0,
  isFreeTier = false
}) => {
  const {
    linkedInstitutions,
    linkedInstitutionNames,
    numConnectedAccounts,
    stats
  } = useFinancialData(financialProfile, financialContext, demoMode);

  if (isFreeTier && baseTierNumberOfConnectedAccounts > 0) {
    return <FreeTierView baseTierNumberOfConnectedAccounts={baseTierNumberOfConnectedAccounts} />;
  }

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-full">
        <PortalHeader
          linkedInstitutionsCount={linkedInstitutions.length}
          numConnectedAccounts={numConnectedAccounts}
        />
        <LinkedAccountsOverview linkedInstitutions={linkedInstitutions} />
        <StatsOverview stats={stats} />
      </div>
    </div>
  );
};
