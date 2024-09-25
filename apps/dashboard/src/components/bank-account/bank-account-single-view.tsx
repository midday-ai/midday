/**
 * @module BankAccountSingleView
 * @description A component that displays a detailed view of a single bank account, including recent transactions and account details.
 *
 * @component
 * @example
 * ```tsx
 * <BankAccountSingleView
 *   bankAccount={bankAccountData}
 *   bankConnections={bankConnectionsData}
 *   userName="John Doe"
 * />
 * ```
 */

import {
  BankAccountSchema,
  BankConnectionSchema,
} from "@midday/supabase/types";
import { Card } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { useMemo } from "react";
import { BankAccountDetails } from "../bank-account-details";
import RecentTransactions from "../recent-transactions";

/**
 * Props for the BankAccountSingleView component
 * @interface BankAccountSingleViewProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
interface BankAccountSingleViewProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** The bank account to display */
  bankAccount: BankAccountSchema;
  /** List of bank connections */
  bankConnections: BankConnectionSchema[];
  /** Optional CSS class name */
  className?: string;
  /** Name of the user */
  userName: string;
}

/**
 * BankAccountSingleView component
 *
 * This component provides a detailed view of a single bank account, including:
 * - Recent transactions
 * - Account details
 *
 * It uses a responsive grid layout to organize the information.
 *
 * @param {BankAccountSingleViewProps} props - The props for the component
 * @returns {JSX.Element} The rendered component
 */
const BankAccountSingleView: React.FC<BankAccountSingleViewProps> = ({
  bankAccount,
  bankConnections,
  className,
  userName,
}) => {
  /**
   * Memoized map of bank connections for efficient lookup
   * @type {Record<string, BankConnectionSchema>}
   */
  const bankAccountMap = useMemo(() => {
    return bankConnections.reduce(
      (acc, connection) => {
        acc[connection.id] = connection;
        return acc;
      },
      {} as Record<string, BankConnectionSchema>,
    );
  }, [bankConnections]);

  /**
   * The bank connection associated with the current bank account
   * @type {BankConnectionSchema}
   */
  const bankConnection = bankAccountMap[bankAccount.bank_connection_id!];

  return (
    <div className={cn(className, "py-[2%]")}>
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="col-span-2 p-[1%] flex flex-col gap-3">
          <RecentTransactions
            limit={100}
            accountId={bankAccount.id}
            title={`${bankAccount.name} Transactions`}
            description={`Recent transactions for the bank account`}
            className="border-none shadow-none"
          />
        </Card>
        <Card className="col-span-1 p-[3%] flex flex-col gap-3">
          <BankAccountDetails
            bankAccount={bankAccount}
            bankConnection={bankConnection}
            userName={userName}
            transactions={[]}
            transactionsLoading={false}
          />
        </Card>
      </div>
    </div>
  );
};

export default BankAccountSingleView;
