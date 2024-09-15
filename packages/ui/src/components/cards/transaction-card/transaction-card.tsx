import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { Transaction } from "client-typescript-sdk";
import { FinancialDataProcessor } from "../../../lib/financial-data-processor";

import { Button } from "../../button";
import { Card } from "../../card";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "../../sheet";

export interface TransactionCardProps {
  transaction: Transaction;
  enableSimpleView?: boolean;
}

const shortenIfTooLong = (str: string, maxLength: number): string =>
  str.length > maxLength ? str.substr(0, maxLength) + "..." : str;

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  enableSimpleView = false,
}) => {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  return (
    <Sheet>
      <Card className="w-full p-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="text-md truncate font-semibold">
              {shortenIfTooLong(
                transaction.merchantName || "Unknown Merchant",
                25,
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {transaction.categories?.map((category, index) => (
              <Button
                key={index}
                className="py-2 text-xs"
                size="sm"
                variant="outline"
              >
                {category.toLowerCase()}
              </Button>
            ))}
          </div>
          <div className="flex flex-col justify-evenly gap-1">
            {transaction.amount && (
              <span className="text-lg font-bold">
                {FinancialDataProcessor.formatCurrency(transaction.amount)}
              </span>
            )}
            <span className="font-base text-xs">
              {FinancialDataProcessor.formatDate(
                transaction.authorizedDate?.toString() ?? "",
              )}
            </span>
          </div>
          <SheetTrigger
            asChild
            onClick={() => setSelectedTransaction(transaction)}
          >
            <div className="ml-3 flex flex-auto items-center truncate text-sm font-bold">
              <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />
            </div>
          </SheetTrigger>
          <SheetContent className="p-[5%] md:min-w-[90%]">
            {selectedTransaction && (
              <SheetHeader>
                <p>{selectedTransaction.merchantName || "Unknown Merchant"}</p>
              </SheetHeader>
            )}
          </SheetContent>
        </div>
      </Card>
    </Sheet>
  );
};

export { TransactionCard };
