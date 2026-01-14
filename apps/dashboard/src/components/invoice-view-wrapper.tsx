"use client";

import { cn } from "@midday/ui/cn";
import { useMediaQuery } from "@midday/ui/hooks";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
  customerPortalEnabled?: boolean;
  customerPortalId?: string | null;
  children: ReactNode;
  onPaymentOpenChange?: (open: boolean) => void;
  isPaymentOpen?: boolean;
  invoiceWidth?: number;
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
  customerPortalEnabled,
  customerPortalId,
  children,
  onPaymentOpenChange,
  isPaymentOpen,
  invoiceWidth = 595,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [internalPaymentOpen, setInternalPaymentOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Track window width to determine if we should use overlay or push mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const paymentOpen = isPaymentOpen ?? internalPaymentOpen;
  const handlePaymentOpenChange = onPaymentOpenChange ?? setInternalPaymentOpen;

  // Sheet width is 520px, invoice width varies (595px for A4, 750px for Letter)
  // Add some padding (40px) for margins
  const sheetWidth = 520;
  const minWidthNeeded = invoiceWidth + sheetWidth + 40;
  const useOverlay = windowWidth > 0 && windowWidth < minWidthNeeded;

  const handlePaymentSuccess = () => {
    setStatus("paid");
  };

  return (
    <>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isDesktop && paymentOpen && !useOverlay && "md:mr-[520px]",
        )}
      >
        <div className="flex flex-col justify-center items-center min-h-screen dotted-bg p-4 sm:p-6 md:p-0">
          <div
            className="flex flex-col w-full max-w-full py-6"
            style={{ maxWidth: invoiceWidth }}
          >
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
              portalEnabled={customerPortalEnabled}
              portalId={customerPortalId}
            />
            {children}
          </div>
        </div>
      </div>

      <InvoiceToolbar
        token={token}
        invoiceNumber={invoiceNumber}
        paymentEnabled={paymentEnabled}
        amount={amount}
        currency={currency}
        status={status}
        onPaymentSuccess={handlePaymentSuccess}
        portalEnabled={customerPortalEnabled}
        portalId={customerPortalId}
        onPaymentOpenChange={handlePaymentOpenChange}
        isPaymentOpen={paymentOpen}
        useOverlay={useOverlay}
      />
    </>
  );
}
