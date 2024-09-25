/**
 * @module BankAccountOverview
 * @description A component that displays an overview of multiple bank accounts, allowing users to select and view detailed information for each account.
 *
 * @component
 * @example
 * ```tsx
 * <BankAccountOverview
 *   bankAccounts={bankAccountsData}
 *   bankConnectionMap={bankConnectionMapData}
 *   userName="John Doe"
 * />
 * ```
 */

import { Tables } from "@midday/supabase/types";
import { useState } from "react";
import { MettalicCard } from "../mettalic-card";
import { BankAccountSheet } from "../sheets/bank-account-sheet";

/** Type alias for bank account data */
type BankAccount = Tables<"bank_accounts">;
/** Type alias for bank connection data */
type BankConnection = Tables<"bank_connections">;

/**
 * Props for the BankAccountOverview component
 * @interface BankAccountOverviewProps
 */
interface BankAccountOverviewProps {
  /** Array of bank account data */
  bankAccounts: Array<BankAccount>;
  /** Map of bank connection data, keyed by connection ID */
  bankConnectionMap: Record<string, BankConnection>;
  /** Name of the user */
  userName: string;
}

/**
 * BankAccountOverview component
 *
 * This component provides an overview of multiple bank accounts, including:
 * - A grid of metallic cards representing each bank account
 * - A detailed sheet view for the selected bank account
 *
 * @param {BankAccountOverviewProps} props - The props for the component
 * @returns {JSX.Element} The rendered component
 */
export const BankAccountOverview: React.FC<BankAccountOverviewProps> = ({
  bankAccounts,
  bankConnectionMap,
  userName,
}) => {
  /**
   * State for the currently selected bank account
   * @type {BankAccount | null}
   */
  const [selectedBankAccount, setSelectedBankAccount] =
    useState<BankAccount | null>(null);

  /**
   * State for controlling the visibility of the bank account sheet
   * @type {boolean}
   */
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <>
      <div className="flex flex-1 flex-wrap gap-3 p-[2%]">
        {bankAccounts.map((bankAccount) => {
          const bankConnection =
            bankConnectionMap[bankAccount.bank_connection_id!];
          return (
            <div
              key={bankAccount.id}
              onClick={() => {
                setSelectedBankAccount(bankAccount);
                setIsSheetOpen(true);
              }}
            >
              <MettalicCard
                cardIssuer={bankConnection?.name ?? "Bank Account"}
                cardHolderName={userName ?? "User Name"}
                cardNumber={bankAccount.name ?? "xxxx"}
              />
            </div>
          );
        })}
      </div>
      {selectedBankAccount && (
        <BankAccountSheet
          isOpen={isSheetOpen}
          setOpen={setIsSheetOpen}
          bankAccount={selectedBankAccount}
          bankConnection={
            bankConnectionMap[selectedBankAccount.bank_connection_id!]
          }
          userName={userName}
        />
      )}
    </>
  );
};
