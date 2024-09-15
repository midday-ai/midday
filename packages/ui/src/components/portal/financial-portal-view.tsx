"use client";

import {
  FinancialUserProfile,
  MelodyFinancialContext,
} from "client-typescript-sdk";
import React, { useMemo } from "react";
import { FinancialDataGenerator } from "../../lib/random/financial-data-generator";
import { Card } from "../card";
import { LinkedAccountCard } from "../cards/linked-account-card/linked-account-card";

interface FinancialPortalOverviewProps {
  financialProfile?: FinancialUserProfile;
  financialContext?: MelodyFinancialContext;
  demoMode?: boolean;
}

export const FinancialPortalOverview: React.FC<
  FinancialPortalOverviewProps
> = ({ financialProfile, financialContext, demoMode = false }) => {
  const {
    linkedInstitutions,
    linkedInstitutionNames,
    bankAccounts,
    creditAccounts,
    investmentAccounts,
    mortgageLoanAccounts,
    studentLoanAccounts,
    numConnectedAccounts,
    stats,
  } = useMemo(() => {
    if (demoMode || !financialProfile || !financialContext) {
      financialProfile = FinancialDataGenerator.generateFinancialProfile();
      financialContext = FinancialDataGenerator.generateFinancialContext();
    }

    const linkedInstitutions = financialProfile.link || [];

    const linkedInstitutionNames = linkedInstitutions.map((link) =>
      link.institutionName ? " " + link.institutionName.toLowerCase() : "",
    );

    const bankAccounts = linkedInstitutions.flatMap(
      (link) => link.bankAccounts || [],
    );
    const creditAccounts = linkedInstitutions.flatMap(
      (link) => link.creditAccounts || [],
    );
    const investmentAccounts = linkedInstitutions.flatMap(
      (link) => link.investmentAccounts || [],
    );
    const mortgageLoanAccounts = linkedInstitutions.flatMap(
      (link) => link.mortgageAccounts || [],
    );
    const studentLoanAccounts = linkedInstitutions.flatMap(
      (link) => link.studentLoanAccounts || [],
    );

    const numConnectedAccounts =
      bankAccounts.length +
      creditAccounts.length +
      investmentAccounts.length +
      mortgageLoanAccounts.length +
      studentLoanAccounts.length;

    const stats = [
      { id: 1, name: "Connected Accounts", value: numConnectedAccounts },
      {
        id: 2,
        name: "Number Of Linked Institutions",
        value: `${linkedInstitutions.length}`,
      },
      {
        id: 3,
        name: "Linked Institutions",
        value: `${linkedInstitutionNames}`,
      },
    ];

    return {
      linkedInstitutions,
      linkedInstitutionNames,
      bankAccounts,
      creditAccounts,
      investmentAccounts,
      mortgageLoanAccounts,
      studentLoanAccounts,
      numConnectedAccounts,
      stats,
    };
  }, [financialProfile, financialContext, demoMode]);

  return (
    <div className="bg-background text-foreground">
      <div>
        <div className="mx-auto w-full">
          <div className="flex flex-row justify-between">
            <p className="text-base font-semibold leading-7 text-blue-600 md:pt-[5%]">
              Solomon AI
            </p>
          </div>

          <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Financial Portal
            <span className="font-base ml-4 text-sm">
              {" "}
              {linkedInstitutions !== undefined ? linkedInstitutions.length : 0}{" "}
              Linked Accounts
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-foreground/3">
            Your Premier Gateway to Wealth Mastery and Financial Liberation.
          </p>
          <div>
            <h2 className="py-5 text-2xl font-bold tracking-tight">
              Overview{" "}
              <span className="ml-1 text-xs">
                {" "}
                {linkedInstitutions.length} Linked Accounts
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 pt-3 md:grid-cols-3 lg:grid-cols-3">
              {linkedInstitutions.map((link, idx) => (
                <LinkedAccountCard link={link} key={idx} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.id} className="flex flex-col bg-gray-400/5 p-8">
            <dt className="text-sm font-semibold leading-6 text-foreground/3">
              {stat.name}
            </dt>
            <dd className="order-first text-3xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
