"use client";

import { cn } from "@midday/ui/cn";
import { SubmitButton } from "@midday/ui/submit-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { revalidateAfterCheckout } from "@/actions/revalidate-action";
import { useTRPC } from "@/trpc/client";

// Polling timeout in milliseconds (30 seconds)
const POLLING_TIMEOUT_MS = 30_000;

type PlansProps = {
  currency?: string;
};

export function Plans({ currency }: PlansProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const currencySymbol = currency === "EUR" ? "€" : "$";
  const [isSubmitting, setIsSubmitting] = useState(0);
  const [isPollingForPlan, setIsPollingForPlan] = useState(false);
  const isPollingRef = useRef(false); // Ref to track polling state for event handlers
  const pollingStartedAtRef = useRef<number | null>(null);
  const trpc = useTRPC();
  const checkoutInstanceRef = useRef<Awaited<
    ReturnType<typeof PolarEmbedCheckout.create>
  > | null>(null);

  // Poll for plan update after checkout success
  const { data: user } = useQuery({
    ...trpc.user.me.queryOptions(),
    refetchInterval: (query) => {
      if (!isPollingForPlan) return false;

      // Plan updated - stop polling
      // Must explicitly check plan exists to avoid false positives when query returns undefined
      const plan = query.state.data?.team?.plan;
      if (plan && plan !== "trial") {
        return false;
      }

      // Timeout exceeded - stop polling
      if (
        pollingStartedAtRef.current &&
        Date.now() - pollingStartedAtRef.current > POLLING_TIMEOUT_MS
      ) {
        return false;
      }

      return 1500;
    },
  });
  const { data, isLoading } = useQuery(trpc.team.availablePlans.queryOptions());
  const theme = useTheme().resolvedTheme === "dark" ? "dark" : "light";

  // Initialize PolarEmbedCheckout on mount
  useEffect(() => {
    PolarEmbedCheckout.init();
  }, []);

  // Clean up checkout instance on unmount
  useEffect(() => {
    return () => {
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.close();
      }
    };
  }, []);

  // Handle polling completion (success or timeout)
  useEffect(() => {
    if (!isPollingForPlan) return;

    const isTimedOut =
      pollingStartedAtRef.current &&
      Date.now() - pollingStartedAtRef.current > POLLING_TIMEOUT_MS;
    // Must explicitly check plan exists to avoid false positives when user data is undefined
    const plan = user?.team?.plan;
    const planUpdated = plan != null && plan !== "trial";

    if (planUpdated || isTimedOut) {
      pollingStartedAtRef.current = null;
      setIsPollingForPlan(false);
      isPollingRef.current = false;

      if (isTimedOut && !planUpdated) {
        setIsSubmitting(0);
      }

      // Revalidate in both cases - webhook may have succeeded but cache is stale
      revalidateAfterCheckout();
    }
  }, [isPollingForPlan, user?.team?.plan]);

  const createCheckoutMutation = useMutation(
    trpc.billing.createCheckout.mutationOptions(),
  );

  const handleCheckout = async (plan: "starter" | "pro", planType: string) => {
    try {
      setIsSubmitting(plan === "starter" ? 1 : 2);

      const { url } = await createCheckoutMutation.mutateAsync({
        plan,
        planType,
        embedOrigin: window.location.origin,
      });

      const checkout = await PolarEmbedCheckout.create(url, theme);
      checkoutInstanceRef.current = checkout;

      // Handle checkout events
      checkout.addEventListener("success", (event: any) => {
        // Prevent Polar's automatic redirect
        event.preventDefault();
        // Start polling for plan update with timestamp for timeout
        pollingStartedAtRef.current = Date.now();
        isPollingRef.current = true;
        setIsPollingForPlan(true);
      });

      checkout.addEventListener("close", () => {
        checkoutInstanceRef.current = null;
        // Only reset spinner if not polling for plan update
        if (!isPollingRef.current) {
          setIsSubmitting(0);
        }
      });

      checkout.addEventListener("confirmed", () => {
        // Payment is being processed
      });
    } catch (error) {
      console.error("Failed to open checkout", error);
      setIsSubmitting(0);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full">
        <div className="flex justify-center mb-8 sm:mb-8 lg:mb-16">
          <div
            className="relative flex items-stretch bg-muted"
            style={{ width: "fit-content" }}
          >
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none ${
                  billingPeriod === "monthly"
                    ? "text-foreground bg-background border-border"
                    : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
                }`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  marginBottom: billingPeriod === "monthly" ? "-1px" : "0px",
                  position: "relative",
                  zIndex: billingPeriod === "monthly" ? 10 : 1,
                }}
              >
                <span>Monthly</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("yearly")}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none ${
                  billingPeriod === "yearly"
                    ? "text-foreground bg-background border-border"
                    : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
                }`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  marginBottom: billingPeriod === "yearly" ? "-1px" : "0px",
                  position: "relative",
                  zIndex: billingPeriod === "yearly" ? 10 : 1,
                }}
              >
                <span>Yearly (Save 20%)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 w-full">
          {/* Starter Plan */}
          <div className="bg-background border border-border p-4 py-6 h-full flex flex-col">
            <div className="mb-4">
              <h3 className="font-sans text-base text-foreground mb-1">
                Starter
              </h3>
              <p className="font-sans text-sm text-muted-foreground mb-3">
                For founders running their business solo
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-2xl text-foreground">
                  {billingPeriod === "monthly"
                    ? `${currencySymbol}29`
                    : `${currencySymbol}23`}
                </span>
                <span className="font-sans text-sm text-muted-foreground">
                  /month
                </span>
              </div>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                {billingPeriod === "monthly"
                  ? "Billed monthly"
                  : "Billed yearly"}
              </p>
            </div>

            <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Invoicing with recurring and online payments
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Automatic bank sync and categorization
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Receipt capture via Gmail, Outlook, or upload
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Financial reports, burn rate, and tax summaries
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  AI assistant for financial insights
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Time tracking and project billing
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Multi-currency support
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Export to Xero, QuickBooks, or Fortnox
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  3 banks · 15 invoices · 10GB storage
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SubmitButton
                      variant="secondary"
                      className={cn(
                        "w-full bg-background border border-border text-foreground font-sans text-sm py-3 px-4 hover:bg-muted transition-colors",
                        !isLoading &&
                          !data?.starter &&
                          "pointer-events-none opacity-50",
                      )}
                      isSubmitting={isSubmitting === 1}
                      onClick={() => {
                        if (!data?.starter || isLoading) {
                          return;
                        }
                        handleCheckout(
                          "starter",
                          billingPeriod === "yearly"
                            ? "starter_yearly"
                            : "starter",
                        );
                      }}
                      disabled={!isLoading && !data?.starter}
                    >
                      Start with Starter
                    </SubmitButton>
                  </div>
                </TooltipTrigger>
                {!isLoading && !data?.starter && (
                  <TooltipContent className="text-xs max-w-[300px]">
                    <p>
                      This plan is not applicable since you have exceeded the
                      limits for this subscription (users or bank connections).
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
              <p className="font-sans text-xs text-muted-foreground text-center">
                Cancel anytime
              </p>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-background border border-primary p-4 py-6 h-full flex flex-col relative">
            <div className="absolute top-0 right-4 -translate-y-1/2">
              <div className="bg-background border border-primary px-2 py-1 rounded-full flex items-center justify-center">
                <span className="font-sans text-xs text-foreground">
                  Most popular
                </span>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="font-sans text-base text-foreground mb-1">Pro</h3>
              <p className="font-sans text-sm text-muted-foreground mb-3">
                For small teams that need more room to grow
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-2xl text-foreground">
                  {billingPeriod === "monthly"
                    ? `${currencySymbol}49`
                    : `${currencySymbol}39`}
                </span>
                <span className="font-sans text-sm text-muted-foreground">
                  /month
                </span>
              </div>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                {billingPeriod === "monthly"
                  ? "Billed monthly"
                  : "Billed yearly"}
              </p>
            </div>

            <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Everything in Starter
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  10 banks · 50 invoices · 100GB storage
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Up to 10 team members
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  API access and integrations
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Shareable report links
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-foreground leading-[1.5rem]">•</span>
                <span className="font-sans text-sm text-foreground leading-relaxed">
                  Priority support
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <SubmitButton
                className="w-full btn-inverse font-sans text-sm py-3 px-4 transition-colors"
                onClick={() =>
                  handleCheckout(
                    "pro",
                    billingPeriod === "yearly" ? "pro_yearly" : "pro",
                  )
                }
                isSubmitting={isSubmitting === 2}
              >
                Start with Pro
              </SubmitButton>
              <p className="font-sans text-xs text-muted-foreground text-center">
                Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
