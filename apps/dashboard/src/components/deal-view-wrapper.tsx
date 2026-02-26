"use client";

import { cn } from "@midday/ui/cn";
import { useMediaQuery } from "@midday/ui/hooks";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import MerchantHeader from "./merchant-header";
import DealToolbar from "./deal-toolbar";

type Props = {
  token: string;
  dealNumber: string;
  paymentEnabled?: boolean;
  amount?: number;
  currency?: string;
  initialStatus?: string;
  merchantName: string;
  merchantWebsite?: string | null;
  merchantPortalEnabled?: boolean;
  merchantPortalId?: string | null;
  children: ReactNode;
  onPaymentOpenChange?: (open: boolean) => void;
  isPaymentOpen?: boolean;
  dealWidth?: number;
};

export function DealViewWrapper({
  token,
  dealNumber,
  paymentEnabled,
  amount,
  currency,
  initialStatus,
  merchantName,
  merchantWebsite,
  merchantPortalEnabled,
  merchantPortalId,
  children,
  onPaymentOpenChange,
  isPaymentOpen,
  dealWidth = 595,
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

  // Sheet width is 520px, deal width varies (595px for A4, 750px for Letter)
  // Add some padding (40px) for margins
  const sheetWidth = 520;
  const minWidthNeeded = dealWidth + sheetWidth + 40;
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
            style={{ maxWidth: dealWidth }}
          >
            <MerchantHeader
              name={merchantName}
              website={merchantWebsite}
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
              portalEnabled={merchantPortalEnabled}
              portalId={merchantPortalId}
            />
            {children}
          </div>
        </div>
      </div>

      <DealToolbar
        token={token}
        dealNumber={dealNumber}
        paymentEnabled={paymentEnabled}
        amount={amount}
        currency={currency}
        status={status}
        onPaymentSuccess={handlePaymentSuccess}
        portalEnabled={merchantPortalEnabled}
        portalId={merchantPortalId}
        onPaymentOpenChange={handlePaymentOpenChange}
        isPaymentOpen={paymentOpen}
        useOverlay={useOverlay}
      />
    </>
  );
}
