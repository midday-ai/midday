"use client";

import {
  FinancialUserProfile,
  MelodyFinancialContext,
} from "client-typescript-sdk";
import React from "react";
import { FreeTierView } from "./components/FreeTierView";
import { LinkedAccountsOverview } from "./components/LinkedAccountsOverview";
import { PortalHeader } from "./components/PortalHeader";
import { StatsOverview } from "./components/StatsOverview";
import { useFinancialData } from "./hooks/useFinancialData";

interface FinancialPortalOverviewProps {
  financialProfile?: FinancialUserProfile;
  financialContext?: MelodyFinancialContext;
  demoMode?: boolean;
  baseTierNumberOfConnectedAccounts?: number;
  isFreeTier?: boolean;
  title?: string;
  description?: string;
}

export const FinancialPortalOverview: React.FC<
  FinancialPortalOverviewProps
> = ({
  financialProfile,
  financialContext,
  demoMode = false,
  baseTierNumberOfConnectedAccounts = 0,
  isFreeTier = false,
  title,
  description,
}) => {
  const {
    linkedInstitutions,
    linkedInstitutionNames,
    numConnectedAccounts,
    stats,
  } = useFinancialData(financialProfile, financialContext, demoMode);

  if (isFreeTier && baseTierNumberOfConnectedAccounts > 0) {
    return (
      <FreeTierView
        baseTierNumberOfConnectedAccounts={baseTierNumberOfConnectedAccounts}
      />
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-full">
        <PortalHeader
          linkedInstitutionsCount={linkedInstitutions.length}
          numConnectedAccounts={numConnectedAccounts}
          title={title}
          description={description}
        />
        <LinkedAccountsOverview linkedInstitutions={linkedInstitutions} />
        <StatsOverview stats={stats} />
      </div>
    </div>
  );
};
