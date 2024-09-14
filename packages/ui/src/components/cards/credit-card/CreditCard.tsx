// CreditCard.tsx
import React from "react";

import { Card } from "../../card";

/*
 * The props for the `CreditCard` component.
 *
 * @interface CreditCardProps
 * */
interface CreditCardProps {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardType?: "Visa" | "MasterCard" | "Amex" | "Discover";
}

/**
 * The `CreditCard` component displays a representation of a credit card with essential details.
 */
export const CreditCard: React.FC<CreditCardProps> = ({
  cardholderName,
  cardNumber,
  expiryDate,
  cvv,
  cardType = "Visa",
}) => {
  return (
    <Card className="m-2 rounded-lg border bg-gradient-to-tr from-gray-600 to-slate-900 p-6 text-foreground md:min-w-[300px]">
      <div className="flex justify-between">
        <div>{cardType}</div>
        <div className="font-semibold">BANK</div>
      </div>
      <div className="font-base my-4 text-lg">
        <div>{cardNumber.match(/.{1,4}/g)?.join(" ")}</div>
        <div>{cardholderName}</div>
        <div>{expiryDate}</div>
      </div>
      <div className="text-sm">CVV: {cvv.length > 0 ? cvv : "XXXX"}</div>
    </Card>
  );
};
