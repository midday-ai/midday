import { useMemo } from "react";
import { FinancialUserProfile, MelodyFinancialContext } from "client-typescript-sdk";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";

export const useFinancialData = (
  financialProfile?: FinancialUserProfile,
  financialContext?: MelodyFinancialContext,
  demoMode = false
) => {
  return useMemo(() => {
    if (demoMode || !financialProfile || !financialContext) {
      financialProfile = FinancialDataGenerator.generateFinancialProfile();
      financialContext = FinancialDataGenerator.generateFinancialContext();
    }

    const linkedInstitutions = financialProfile.link || [];
    const linkedInstitutionNames = linkedInstitutions.map((link) =>
      link.institutionName ? " " + link.institutionName.toLowerCase() : ""
    );

    const allAccounts = [
      ...linkedInstitutions.flatMap((link) => link.bankAccounts || []),
      ...linkedInstitutions.flatMap((link) => link.creditAccounts || []),
      ...linkedInstitutions.flatMap((link) => link.investmentAccounts || []),
      ...linkedInstitutions.flatMap((link) => link.mortgageAccounts || []),
      ...linkedInstitutions.flatMap((link) => link.studentLoanAccounts || []),
    ];

    const numConnectedAccounts = allAccounts.length;

    const stats = [
      { id: 1, name: "Connected Accounts", value: numConnectedAccounts },
      { id: 2, name: "Number Of Linked Institutions", value: `${linkedInstitutions.length}` },
      { id: 3, name: "Linked Institutions", value: `${linkedInstitutionNames}` },
    ];

    return {
      linkedInstitutions,
      linkedInstitutionNames,
      numConnectedAccounts,
      stats,
    };
  }, [financialProfile, financialContext, demoMode]);
};