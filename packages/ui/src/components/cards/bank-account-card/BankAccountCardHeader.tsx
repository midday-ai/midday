"use client";

import { useContext } from "react";
import { FinancialDataProcessor } from "../../../lib/financial-data-processor";

import React from "react";
import { Button } from "../../button";
import { CardHeader, CardTitle } from "../../card";
import { Label } from "../../label";
import { BankAccountContext } from "./BankAccountCard";

/**
 * The `BankAccountCardHeader` component is responsible for rendering the header section of a bank account card in a user interface.
 *
 * This component showcases critical information about a bank account, such as:
 * - The account's current balance.
 * - Account name.
 * - Account subtype (e.g., Savings, Checking).
 * - Account number.
 * - A dropdown menu to view associated pockets of the bank account.
 *
 * This component relies on utility functions for formatting numbers and pocket names.
 *
 * @remarks
 * The component fetches bank account information from the `BankAccountContext` and presents it in a structured format.
 * It utilizes various UI components such as `Badge`, `Button`, `Label`, and `DropdownMenu` to display information effectively.
 *
 * @example
 * ```tsx
 * import { BankAccountCardHeader } from './path-to-component';
import { FinancialDataProcessor } from '../../../lib/financial-data-processor';
 *
 * function BankAccountView() {
 *   return (
 *     <BankAccountContext.Provider value={someBankAccount}>
 *       <BankAccountCardHeader />
 *     </BankAccountContext.Provider>
 *   );
 * }
 * ```
 *
 * @example Using within a card view:
 * ```tsx
 * <Card>
 *   <BankAccountCardHeader />
 *   // ... other card content
 * </Card>
 * ```
 *
 * @returns {React.FC} Returns a React Functional Component.
 */
const BankAccountCardHeader: React.FC = () => {
  const bankAccount = useContext(BankAccountContext);
  if (bankAccount === undefined) {
    return null;
  }

  const bankAccountInstance = bankAccount;
  // get the goals from the pockets
  const goals = bankAccountInstance.pockets?.reduce((acc, pocket) => {
    if (pocket.goals) {
      acc += pocket.goals.length;
    }
    return acc;
  }, 0);

  const numberOfDecimalPointsToFormatNumbers = 2;
  return (
    <CardHeader className="grid grid-cols-[1fr_110px] items-start gap-4 space-y-0">
      <div className="space-y-1 text-left">
        <CardTitle className="text-xs font-bold text-gray-900 dark:text-gray-200">
          $
          {FinancialDataProcessor.formatNumber(
            bankAccount.balance,
            numberOfDecimalPointsToFormatNumbers,
          )}
        </CardTitle>
        <CardTitle
          className="text-xs font-bold"
          style={{
            fontSize: "11px",
          }}
        >
          {bankAccount.name}
        </CardTitle>
        <div>
          <div className="flex flex-1 justify-start gap-2">
            <Button
              className="rounded-2xl border border-black bg-white px-2 font-bold text-background"
              style={{
                fontSize: "10px",
              }}
              variant={"outline"}
            >
              {bankAccount.subtype}
            </Button>
          </div>
        </div>
        <div>
          <div className="flex gap-1">
            <span className="text-xs text-gray-600 dark:text-gray-200">
              bankAccount Number:{" "}
            </span>
            <span className="text-xs font-bold">{bankAccount.number}</span>
          </div>
        </div>
        <div className="flex flex-1 gap-2">
          <Label className="text-2xl font-bold">
            $
            {FinancialDataProcessor.formatNumber(
              bankAccount.balance,
              numberOfDecimalPointsToFormatNumbers,
            )}
          </Label>
          <Button
            className="flex justify-center rounded-2xl p-2 text-xs"
            variant={"outline"}
          >
            {bankAccountInstance.pockets?.length} Pockets
          </Button>
          <Button
            className="flex justify-center rounded-2xl p-2 text-xs"
            variant={"outline"}
          >
            {goals} Goals
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

export { BankAccountCardHeader };
