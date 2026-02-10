"use client";

import { fromStripeAmount } from "@midday/invoice/currency";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { useMediaQuery } from "@midday/ui/hooks";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { Spinner } from "@midday/ui/spinner";
import { SubmitButton } from "@midday/ui/submit-button";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { useSuccessSound } from "@/hooks/use-success-sound";
import { downloadFile } from "@/lib/download";

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="17"
      viewBox="0 0 512 214"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Stripe"
    >
      <path
        fill="currentColor"
        d="M35.982 83.484c0-5.546 4.551-7.68 12.09-7.68 10.808 0 24.461 3.272 35.27 9.103V51.484c-11.804-4.693-23.466-6.542-35.27-6.542-28.872 0-48.072 15.075-48.072 40.248 0 39.254 54.045 32.996 54.045 49.92 0 6.541-5.689 8.675-13.653 8.675-11.804 0-26.88-4.836-38.827-11.378v34.133c13.227 5.689 26.596 8.107 38.827 8.107 29.582 0 49.92-14.648 49.92-40.106-.142-42.382-54.187-35.413-54.187-51.058h-.143zm96.142-66.986l-34.702 7.395v113.92c0 21.049 15.786 36.551 36.835 36.551 11.662 0 20.196-2.133 24.889-4.693v-30.871c-4.551 1.849-27.022 8.391-27.022-12.658V77.653h27.022V47.36h-27.022V16.498zm71.111 41.387l-2.276-10.525h-30.72v124.445h35.556V84.32c8.39-10.951 22.613-8.96 27.022-7.396V47.36c-4.551-1.707-21.191-4.836-29.582 10.524zm38.258-10.524h35.698v124.444h-35.698V47.36zm0-10.809l35.698-7.68V0l-35.698 7.538v28.871h.142-.142zm109.938 10.524c-13.938 0-22.898 6.542-27.876 11.093l-1.849-8.817h-31.289v165.831l35.556-7.538v-40.248c5.12 3.698 12.658 8.96 25.173 8.96 25.458 0 48.64-20.48 48.64-65.564-.142-41.244-23.608-63.717-48.497-63.717h.142zm-8.533 97.991c-8.391 0-13.369-2.987-16.782-6.685V83.484c3.698-4.124 8.818-6.969 16.924-6.969 12.942 0 21.902 14.507 21.902 33.138 0 19.058-8.818 33.28-21.902 33.28l-.142.143zM512 110.08c0-36.409-17.636-65.138-51.342-65.138-33.849 0-54.329 28.729-54.329 64.853 0 42.809 24.178 64.427 58.88 64.427 16.924 0 29.724-3.84 39.395-9.245v-29.44c-9.671 4.835-20.764 7.822-34.844 7.822-13.796 0-26.027-4.835-27.591-21.618h69.547c0-1.849.284-9.244.284-12.658v-.003zm-69.973-13.511c0-16.071 9.813-22.756 18.773-22.756 8.676 0 17.92 6.685 17.92 22.756h-36.693z"
      />
    </svg>
  );
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToken: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  onSuccess?: () => void;
  prefetch?: boolean;
  useOverlay?: boolean;
}

interface PaymentFormProps {
  onSuccess?: (paymentIntentId: string) => void;
  onCancel: () => void;
  amount: number;
  currency: string;
}

function PaymentForm({
  onSuccess,
  onCancel,
  amount,
  currency,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent?.id) {
      // Payment succeeded
      onSuccess?.(paymentIntent.id);
    }
  };

  const formatAmount = (stripeAmount: number, curr: string) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: curr.toUpperCase(),
    }).format(fromStripeAmount(stripeAmount, curr));
  };

  const [isReady, setIsReady] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 min-h-0">
        {/* Amount - animates in first */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
          className="bg-muted/50 rounded-lg p-4 text-center"
        >
          <p className="text-sm text-muted-foreground mb-1">Amount due</p>
          <p className="text-2xl">{formatAmount(amount, currency)}</p>
        </motion.div>

        {/* Payment form skeleton - shows while loading */}
        {!isReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="space-y-4"
          >
            {/* Payment method tabs skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
            {/* Card number field skeleton */}
            <Skeleton className="h-12 w-full" />
            {/* Expiry and CVC row skeleton */}
            <div className="flex gap-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </motion.div>
        )}

        {/* Payment form - animates in when ready */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isReady ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className={isReady ? "" : "absolute opacity-0 pointer-events-none"}
        >
          <PaymentElement
            options={{
              layout: "tabs",
            }}
            onReady={() => setIsReady(true)}
          />
        </motion.div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Buttons - fixed at bottom */}
      <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-border pb-2">
        <SubmitButton
          isSubmitting={isProcessing}
          disabled={!stripe || !elements || isProcessing || !isReady}
          className="w-full"
        >
          {isProcessing ? "Processing..." : "Pay now"}
        </SubmitButton>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PaymentModal({
  open,
  onOpenChange,
  invoiceToken,
  invoiceNumber,
  onSuccess,
  prefetch,
  useOverlay = false,
}: PaymentModalProps) {
  const { resolvedTheme } = useTheme();
  const { play: playSuccessSound } = useSuccessSound();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    stripeAccountId: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Need to wait for mount to access theme
  useEffect(() => setMounted(true), []);

  // Auto-initialize payment when modal opens or prefetch is triggered
  useEffect(() => {
    if ((open || prefetch) && !paymentData && !isLoading && !error) {
      initializePayment();
    }
  }, [open, prefetch]);

  // Stripe Elements appearance based on theme
  const getAppearance = (): Appearance => {
    const isDark = mounted && resolvedTheme === "dark";

    return {
      theme: "stripe",
      variables: {
        borderRadius: "0px",
        colorPrimary: isDark ? "#FFFFFF" : "#121212",
        // Sheet background: dark=#0C0C0C, light=#FAFAF9
        colorBackground: isDark ? "#0C0C0C" : "#FAFAF9",
        colorText: isDark ? "#F5F5F3" : "#121212",
        colorTextSecondary: isDark ? "#A1A1A1" : "#666666",
        colorDanger: "#EF4444",
        fontFamily: "system-ui, -apple-system, sans-serif",
        spacingUnit: "4px",
        spacingGridRow: "16px",
        spacingGridColumn: "16px",
      },
      rules: {
        ".Input": {
          backgroundColor: isDark ? "#0C0C0C" : "#F0F0EE",
          border: isDark ? "1px solid #2E2E2E" : "1px solid #E5E5E5",
          boxShadow: "none",
          padding: "12px",
        },
        ".Input:focus": {
          border: isDark ? "1px solid #404040" : "1px solid #121212",
          boxShadow: "none",
        },
        ".TabList": {
          border: "none",
          boxShadow: "none",
        },
        ".Tab": {
          backgroundColor: "transparent",
          border: isDark ? "1px solid #2E2E2E" : "1px solid #E5E5E5",
          boxShadow: "none",
          outline: "none",
          color: isDark ? "#A1A1A1" : "#666666",
          padding: "10px 12px",
        },
        ".Tab:hover": {
          backgroundColor: "transparent",
          border: isDark ? "1px solid #404040" : "1px solid #CCCCCC",
          boxShadow: "none",
          color: isDark ? "#FFFFFF" : "#121212",
        },
        ".Tab:focus": {
          boxShadow: "none",
          outline: "none",
        },
        ".Tab--selected": {
          backgroundColor: "transparent",
          border: isDark ? "1px solid #FFFFFF" : "1px solid #121212",
          boxShadow: "none",
          outline: "none",
          color: isDark ? "#FFFFFF" : "#121212",
        },
        ".Tab--selected:hover": {
          backgroundColor: "transparent",
          border: isDark ? "1px solid #FFFFFF" : "1px solid #121212",
          boxShadow: "none",
          color: isDark ? "#FFFFFF" : "#121212",
        },
        ".Tab--selected:focus": {
          boxShadow: "none",
          outline: "none",
        },
        ".Tab--selected .TabIcon": {
          fill: isDark ? "#FFFFFF" : "#121212",
        },
        ".Tab--selected .TabLabel": {
          color: isDark ? "#FFFFFF" : "#121212",
        },
        ".Tab--selected:hover .TabLabel": {
          color: isDark ? "#FFFFFF" : "#121212",
        },
        ".TabIcon--selected": {
          fill: isDark ? "#FFFFFF" : "#121212",
        },
        ".Label": {
          color: isDark ? "#A1A1A1" : "#666666",
        },
        ".Block": {
          backgroundColor: "transparent",
          border: "none",
          boxShadow: "none",
          padding: "0",
        },
        ".CheckboxInput": {
          backgroundColor: isDark ? "#0C0C0C" : "#F0F0EE",
          border: isDark ? "1px solid #2E2E2E" : "1px solid #E5E5E5",
        },
        ".CheckboxInput--checked": {
          backgroundColor: isDark ? "#FFFFFF" : "#121212",
          borderColor: isDark ? "#FFFFFF" : "#121212",
        },
        ".CheckboxLabel": {
          color: isDark ? "#A1A1A1" : "#666666",
        },
        ".AccordionItem": {
          backgroundColor: "transparent",
          border: "none",
          boxShadow: "none",
        },
        ".AccordionItemContent": {
          backgroundColor: "transparent",
        },
      },
    };
  };

  const initializePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.midday.ai";

      const response = await fetch(
        `${apiUrl}/invoice-payments/payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: invoiceToken }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to initialize payment");
      }

      const data = await response.json();
      setPaymentData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize payment",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize payment when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !paymentData && !isLoading) {
      initializePayment();
    }
    if (!newOpen) {
      setPaymentData(null);
      setError(null);
      setPaymentSuccess(false);
    }
    onOpenChange(newOpen);
  };

  const handleSuccess = (_paymentIntentId: string) => {
    playSuccessSound();
    setPaymentSuccess(true);
    onSuccess?.();
  };

  const stripePromise = useMemo(() => {
    if (!paymentData) return null;
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured");
      return null;
    }
    return loadStripe(publishableKey, {
      stripeAccount: paymentData.stripeAccountId,
    });
  }, [paymentData?.stripeAccountId]);

  const hasPaymentData = paymentData && stripePromise && !isLoading && !error;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close (desktop only, push mode only)
  // In overlay mode, the backdrop handles closing
  useOnClickOutside(panelRef as RefObject<HTMLElement>, (event) => {
    if (isDesktop && open && !useOverlay) {
      const target = event.target as Element;
      // Don't close if clicking inside the invoice toolbar
      const toolbar = document.querySelector("[data-invoice-toolbar]");
      if (toolbar?.contains(target)) {
        return;
      }
      onOpenChange(false);
    }
  });

  // Success screen component
  const SuccessScreen = ({ isMobile = false }: { isMobile?: boolean }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const formatAmount = (stripeAmount: number, curr: string) => {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: curr.toUpperCase(),
      }).format(fromStripeAmount(stripeAmount, curr));
    };

    const handleDownloadReceipt = async () => {
      setIsDownloading(true);
      try {
        await downloadFile(
          `${process.env.NEXT_PUBLIC_API_URL}/files/download/invoice?token=${invoiceToken}&type=receipt`,
          `receipt-${invoiceNumber}.pdf`,
        );
        // Add minimum delay to show spinner
        await new Promise((resolve) => setTimeout(resolve, 800));
      } finally {
        setIsDownloading(false);
      }
    };

    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center",
          isMobile ? "h-full py-8 px-4" : "flex-1 min-h-0 py-8",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-serif mb-2">Payment successful</h2>
          <p className="text-muted-foreground mb-6">
            Your payment has been processed successfully.
          </p>

          {paymentData && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Amount paid</p>
              <p className="text-xl">
                {formatAmount(paymentData.amount, paymentData.currency)}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleDownloadReceipt}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Spinner className="size-4 mr-2" />
                Downloading...
              </>
            ) : (
              <>
                <Icons.ArrowCoolDown className="size-4 mr-2" />
                Download receipt
              </>
            )}
          </Button>
        </motion.div>
      </div>
    );
  };

  // Shared content component
  const PaymentContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div
      className={cn("flex flex-col", isMobile ? "h-full" : "flex-1 min-h-0")}
    >
      {/* Success screen */}
      {paymentSuccess ? (
        <SuccessScreen isMobile={isMobile} />
      ) : (
        <>
          {/* Error state */}
          {error && !hasPaymentData && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-md mb-4">
                  {error}
                </div>
                <Button variant="outline" onClick={initializePayment}>
                  Try again
                </Button>
              </div>
            </div>
          )}

          {/* Payment form */}
          {hasPaymentData && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentData.clientSecret,
                appearance: getAppearance(),
              }}
            >
              <PaymentForm
                onSuccess={handleSuccess}
                onCancel={() => onOpenChange(false)}
                amount={paymentData.amount}
                currency={paymentData.currency}
              />
            </Elements>
          )}

          {/* Stripe footer - always at bottom */}
          <div className="flex items-center justify-center gap-2 py-2 border-t border-border mt-auto">
            <span className="text-xs text-muted-foreground">
              Secure payment handled by
            </span>
            <StripeLogo className="text-muted-foreground" />
          </div>
        </>
      )}
    </div>
  );

  // Mobile: Use Drawer
  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="flex flex-col max-h-[90vh]">
          <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
            <PaymentContent isMobile />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Fixed side panel (like BaseCanvas) or overlay
  if (useOverlay) {
    // Overlay mode: show as a centered modal-like panel with backdrop
    return (
      <>
        {open && (
          <div
            className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
            onClick={() => onOpenChange(false)}
          />
        )}
        <div
          ref={panelRef}
          data-payment-panel
          className={cn(
            "fixed z-40 scrollbar-hide overflow-y-auto",
            "bg-white dark:bg-[#0C0C0C] border border-[#e6e6e6] dark:border-[#1d1d1d]",
            "overflow-x-hidden transition-all duration-300 ease-in-out",
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[90vw]",
            "max-h-[90vh] shadow-lg",
            open
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none",
            // Hide on mobile (Drawer handles it)
            !isDesktop && "hidden",
          )}
        >
          <div className="h-full flex flex-col relative p-6">
            <PaymentContent />
          </div>
        </div>
      </>
    );
  }

  // Push mode: side panel that pushes content
  return (
    <div
      ref={panelRef}
      data-payment-panel
      className={cn(
        "fixed z-30 scrollbar-hide overflow-y-auto",
        "bg-white dark:bg-[#0C0C0C] border border-[#e6e6e6] dark:border-[#1d1d1d]",
        "overflow-x-hidden transition-transform duration-300 ease-in-out",
        "top-0 bottom-0 right-0 w-[520px]",
        open ? "translate-x-0" : "translate-x-full",
        // Hide on mobile (Drawer handles it)
        !isDesktop && "hidden",
      )}
      style={{ height: "100vh" }}
    >
      <div className="h-full flex flex-col relative p-6">
        <PaymentContent />
      </div>
    </div>
  );
}
