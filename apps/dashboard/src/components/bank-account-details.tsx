import { getBackendClient } from "@/utils/backend";
import {
  BankAccountSchema,
  BankConnectionSchema,
  TransactionSchema,
} from "@midday/supabase/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import {
  AccountBalanceHistory,
  GetAccountBalanceHistoryRequest,
} from "@solomon-ai/client-typescript-sdk";
import { ArrowUpRightFromSquare } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useMemo, useState } from "react";
import { AccountBalanceSummaryCharts } from "./charts/account-balance/account-balance-summary-charts";
import { FormatAmount } from "./format-amount";
import { TransactionsFilterHelper } from "./similar-transactions";

/**
 * Props for the BankAccountDetails component.
 * @interface BankAccountDetailsProps
 */
interface BankAccountDetailsProps {
  /** The bank account details */
  bankAccount: BankAccountSchema;
  /** Optional bank connection details */
  bankConnection?: BankConnectionSchema;
  /** Name of the account holder */
  userName: string;
  /** Flag to indicate if data is still loading */
  isLoading?: boolean;
  /** Array of transactions for the account */
  transactions?: TransactionSchema[];
  /** Flag to indicate if transactions are still loading */
  transactionsLoading: boolean;
  /** ID of the user */
  userId: string;
}

/**
 * BankAccountDetails component displays detailed information about a bank account.
 * It shows account balance, recent transactions, and other relevant details.
 *
 * @param {BankAccountDetailsProps} props - The props for the component
 * @returns {React.ReactElement} The rendered BankAccountDetails component
 */
export function BankAccountDetails({
  bankAccount,
  bankConnection,
  userName,
  isLoading = false,
  transactions,
  transactionsLoading,
  userId,
}: BankAccountDetailsProps): React.ReactElement {
  /**
   * Memoized link to view more details about the account.
   * @type {string}
   */
  const viewMoreLink = useMemo(
    () => `/financial-accounts/${bankAccount.account_id}`,
    [bankAccount.account_id],
  );

  /**
   * Memoized request object for fetching account balance history.
   * @type {GetAccountBalanceHistoryRequest}
   */
  const accountBalanceReq: GetAccountBalanceHistoryRequest = useMemo(
    () => ({
      plaidAccountId: bankAccount.account_id,
      pageNumber: "1",
      pageSize: "100",
    }),
    [bankAccount.account_id],
  );

  /**
   * Fetches the account balance history from the backend.
   * @returns {Promise<any[]>} The account balance history
   */
  const fetchAccountBalance = useCallback(async () => {
    const c = getBackendClient();
    const accountBalance =
      await c.financialServiceApi.getAccountBalanceHistory(accountBalanceReq);
    return accountBalance.accountBalanceHistory;
  }, [accountBalanceReq]);

  /**
   * Memoized account balance history.
   * @type {any[]}
   */
  const accountBalanceHistory = useMemo(() => {
    let history: Array<AccountBalanceHistory> = [];
    fetchAccountBalance().then((data) => {
      history = data ?? [];
    });
    return history;
  }, [fetchAccountBalance, bankAccount.account_id]);

  /**
   * Memoized JSX for rendering account details.
   * @type {React.ReactElement}
   */
  const renderAccountDetails = useMemo(
    () => (
      <AccordionItem value="details">
        <AccordionTrigger>Account Details</AccordionTrigger>
        <AccordionContent className="select-text">
          <p>
            <strong>Account Number:</strong> {bankAccount.account_id}
          </p>
          <p>
            <strong>Currency:</strong> {bankAccount.currency}
          </p>
          <p>
            <strong>Account Holder:</strong> {userName}
          </p>
        </AccordionContent>
      </AccordionItem>
    ),
    [bankAccount.account_id, bankAccount.currency, userName],
  );

  /**
   * Memoized JSX for rendering bank connection details.
   * @type {React.ReactElement | null}
   */
  const renderBankConnection = useMemo(
    () =>
      bankConnection && (
        <AccordionItem value="connection">
          <AccordionTrigger>Bank Connection</AccordionTrigger>
          <AccordionContent className="select-text">
            <p>
              <strong>Bank Name:</strong> {bankConnection.name}
            </p>
            <p>
              <strong>Status:</strong> {bankConnection.status}
            </p>
          </AccordionContent>
        </AccordionItem>
      ),
    [bankConnection],
  );

  /**
   * Memoized JSX for rendering recent transactions.
   * @type {React.ReactElement | null}
   */
  const renderTransactions = useMemo(
    () =>
      transactions &&
      transactions.length > 0 && (
        <AccordionItem value="transactions" className="h-[calc(100vh-400px)]">
          <AccordionTrigger>Recent Transactions</AccordionTrigger>
          <AccordionContent className="h-full">
            {transactionsLoading ? (
              <Skeleton className="w-full h-[100px]" />
            ) : (
              <div className="h-full">
                <TransactionsFilterHelper
                  transactions={transactions}
                  title={`${bankAccount.name}`}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ),
    [transactions, transactionsLoading, bankAccount.name],
  );

  return (
    <div className="overflow-y-auto scrollbar-hide h-full">
      {/* Account header */}
      <div className="flex justify-between mb-8">
        <div className="flex-1 flex-col">
          {isLoading ? (
            <div className="flex items-center justify-between mt-1 mb-6">
              <div className="flex space-x-2 items-center">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="w-[100px] h-[14px] rounded-full" />
              </div>
              <Skeleton className="w-[10%] h-[14px] rounded-full" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {bankConnection?.name && (
                <span className="text-[#606060] text-xs">
                  {bankConnection.name}
                </span>
              )}
              <span className="text-[#606060] text-xs select-text">
                {bankAccount.type}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="mt-6 mb-3 select-text">
              {isLoading ? (
                <Skeleton className="w-[35%] h-[22px] rounded-md mb-2" />
              ) : (
                bankAccount.name
              )}
            </h2>
            <Link href={viewMoreLink}>
              <p className="text-md text-[#606060] hover:text-[#090202] hover:font-bold">
                View More{" "}
                <ArrowUpRightFromSquare size={16} className="inline ml-2" />
              </p>
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col w-full space-y-1">
              {isLoading ? (
                <Skeleton className="w-[50%] h-[30px] rounded-md mb-2" />
              ) : (
                <span className={cn("text-4xl font-mono select-text")}>
                  <FormatAmount
                    amount={bankAccount.balance ?? 0}
                    currency={bankAccount.currency ?? "USD"}
                  />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account details accordion */}
      <Accordion
        type="multiple"
        defaultValue={["details", "connection", "transactions"]}
      >
        {renderAccountDetails}
        {renderBankConnection}

        <div className="py-[2%]">
          <AccountBalanceSummaryCharts
            link={viewMoreLink}
            historicalAccountBalance={accountBalanceHistory}
          />
        </div>

        {renderTransactions}
      </Accordion>
    </div>
  );
}
