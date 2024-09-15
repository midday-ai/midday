"use client";

import React, { createContext, ReactNode } from "react";
import {
  AccountBalanceHistory,
  BankAccount,
  FinancialProfile,
} from "client-typescript-sdk";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";
import { cn } from "../../../utils/cn";

import { Card } from "../../card";

import { BankAccountCardContent } from "./BankAccountCardContent";
import { BankAccountCardFooter } from "./BankAccountCardFooter";
import { BankAccountCardHeader } from "./BankAccountCardHeader";

// eslint-disable-next-line
/** @type {React.Context<T extends BankAccount>} */
const BankAccountContext = createContext<BankAccount | undefined>(undefined);
const FinancialProfileContext = createContext<FinancialProfile>({});
const AccountBalanceHistoryContext = createContext<AccountBalanceHistory[]>([]);

export type BankAccountCardProps = {
  bankAccount: BankAccount;
  financialProfile: FinancialProfile;
  className?: string;
  contextQuestions?: string[];
  enableDemoMode?: boolean;
  children?: ReactNode;
  historicalAccountBalance?: AccountBalanceHistory[];
};

/**
 * Bank Account Card Component that displays the bank account information
 *
 * @param {{ bankAccount: any; financialProfile: any; className: any; contextQuestions: any; enableDemoMode: any; children: any; historicalAccountBalance: any; }} param0
 * @param {*} param0.bankAccount
 * @param {*} param0.financialProfile
 * @param {*} param0.className
 * @param {*} param0.contextQuestions
 * @param {*} param0.enableDemoMode
 * @param {*} param0.children
 * @param {*} param0.historicalAccountBalance
 * @returns {*}
 */
const BankAccountCard: React.FC<BankAccountCardProps> = ({
  bankAccount,
  financialProfile,
  className,
  enableDemoMode,
  children,
  historicalAccountBalance,
}) => {
  const currentBankAccount = enableDemoMode
    ? FinancialDataGenerator.generateRandomBankAccount()
    : bankAccount;

  return (
    <BankAccountContext.Provider value={currentBankAccount}>
      <FinancialProfileContext.Provider value={financialProfile}>
        <AccountBalanceHistoryContext.Provider
          value={historicalAccountBalance ? historicalAccountBalance : []}
        >
          <Card
            className={cn(
              "w-full leading-7 [&:not(:first-child)]:mt-6",
              className,
            )}
          >
            <BankAccountCardHeader />
            <BankAccountCardContent />
            <BankAccountCardFooter />
            {children}
          </Card>
        </AccountBalanceHistoryContext.Provider>
      </FinancialProfileContext.Provider>
    </BankAccountContext.Provider>
  );
};

export {
  AccountBalanceHistoryContext,
  BankAccountCard,
  BankAccountContext,
  FinancialProfileContext
};

