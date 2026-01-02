"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import CustomerHeader from "./customer-header";
import InvoiceToolbar from "./invoice-toolbar";

type Props = {
  token: string;
  invoiceNumber: string;
  paymentEnabled?: boolean;
  amount?: number;
  currency?: string;
  initialStatus?: string;
  customerName: string;
  customerWebsite?: string | null;
  children: ReactNode;
};

export function InvoiceViewWrapper({
  token,
  invoiceNumber,
  paymentEnabled,
  amount,
  currency,
  initialStatus,
  customerName,
  customerWebsite,
  children,
}: Props) {
  const [status, setStatus] = useState(initialStatus);

  const handlePaymentSuccess = () => {
    setStatus("paid");
  };

  return (
    <>
      <CustomerHeader
        name={customerName}
        website={customerWebsite}
        status={
          status as
            | "overdue"
            | "paid"
            | "unpaid"
            | "draft"
            | "canceled"
            | "scheduled"
            | "refunded"
        }
      />

      {children}

      <InvoiceToolbar
        token={token}
        invoiceNumber={invoiceNumber}
        paymentEnabled={paymentEnabled}
        amount={amount}
        currency={currency}
        status={status}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
