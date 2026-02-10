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
import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { revalidateAfterCheckout } from "@/actions/revalidate-action";
import { useTRPC } from "@/trpc/client";

// Polling timeout in milliseconds (30 seconds)
const POLLING_TIMEOUT_MS = 30_000;

export function Plans() {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 w-full">
        {/* Starter Plan */}
        <div className="flex flex-col p-6 border bg-background">
          <h2 className="text-xl mb-2 text-left">Starter</h2>
          <div className="mt-1 flex items-baseline">
            <span className="text-2xl font-medium tracking-tight">$29</span>
            <span className="ml-1 text-xl font-medium">/mo</span>
            <span className="ml-2 text-xs text-muted-foreground">
              Excl. VAT
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-left text-[#878787] font-mono">
              INCLUDING
            </h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">
                  Send up to 10 invoices per month
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">2 connected banks</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Unlimited bank accounts</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Financial overview</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Time Tracker</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">50 inbox items per month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Customer management</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Export CSV & reports</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Assistant</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">10GB Vault Storage</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">2 users</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 border-t-[1px] border-border pt-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SubmitButton
                    variant="secondary"
                    className={cn(
                      "h-9 hover:bg-primary hover:text-secondary w-full",
                      !isLoading &&
                        !data?.starter &&
                        "pointer-events-none opacity-50",
                    )}
                    isSubmitting={isSubmitting === 1}
                    onClick={() => {
                      if (!data?.starter || isLoading) {
                        return;
                      }
                      handleCheckout("starter", "starter");
                    }}
                    disabled={!isLoading && !data?.starter}
                  >
                    Choose starter plan
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
          </div>
        </div>

        {/* Pro Plan */}
        <div className="flex flex-col p-6 border border-primary bg-background relative">
          <div className="absolute top-6 right-6 rounded-full text-[#878787] text-[9px] font-normal border px-2 py-1 font-mono">
            Limited offer
          </div>
          <h2 className="text-xl text-left mb-2">Pro</h2>
          <div className="mt-1 flex items-baseline">
            <span
              className={cn(
                "text-2xl font-medium tracking-tight",
                "line-through text-[#878787]",
              )}
            >
              $99
            </span>
            <span className="ml-1 text-2xl font-medium tracking-tight">
              $49
            </span>

            <span className="ml-1 text-xl font-medium">/mo</span>
            <span className="ml-2 text-xs text-muted-foreground">
              Excl. VAT
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-left text-[#878787] font-mono">
              INCLUDING
            </h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">
                  Send up to 50 invoices per month
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">10 connected banks</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Unlimited bank accounts</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Financial overview</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Time Tracker</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">500 inbox items per month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Customer management</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Export CSV & reports</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">Assistant</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">100GB Vault Storage</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
                <span className="text-xs">10 users</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 border-t border-border pt-4">
            <SubmitButton
              className="h-9 w-full"
              onClick={() => handleCheckout("pro", "pro")}
              isSubmitting={isSubmitting === 2}
            >
              Choose pro plan
            </SubmitButton>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
