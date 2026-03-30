"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { getPlanPricing } from "@midday/plans";
import { cn } from "@midday/ui/cn";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { revalidateAfterCheckout } from "@/actions/revalidate-action";
import { useTRPC } from "@/trpc/client";

const POLLING_TIMEOUT_MS = 30_000;

type PlanOption = "starter" | "pro";

export function StartTrialStep() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>("pro");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPollingForPlan, setIsPollingForPlan] = useState(false);
  const isPollingRef = useRef(false);
  const pollingStartedAtRef = useRef<number | null>(null);
  const checkoutInstanceRef = useRef<Awaited<
    ReturnType<typeof PolarEmbedCheckout.create>
  > | null>(null);

  const trpc = useTRPC();
  const theme = useTheme().resolvedTheme === "dark" ? "dark" : "light";
  const pricing = getPlanPricing(currency === "EUR" ? "EU" : "NA");

  const { data: user } = useQuery({
    ...trpc.user.me.queryOptions(),
    refetchInterval: (query) => {
      if (!isPollingForPlan) return false;

      const plan = query.state.data?.team?.plan;
      if (plan && plan !== "trial") {
        return false;
      }

      if (
        pollingStartedAtRef.current &&
        Date.now() - pollingStartedAtRef.current > POLLING_TIMEOUT_MS
      ) {
        return false;
      }

      return 1500;
    },
  });

  useEffect(() => {
    PolarEmbedCheckout.init();
  }, []);

  useEffect(() => {
    return () => {
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz?.startsWith("Europe/")) {
        setCurrency("EUR");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isPollingForPlan) return;

    const plan = user?.team?.plan;
    const planUpdated = plan != null && plan !== "trial";

    if (planUpdated) {
      pollingStartedAtRef.current = null;
      setIsPollingForPlan(false);
      isPollingRef.current = false;

      track({
        event: LogEvents.OnboardingCompleted.name,
        channel: LogEvents.OnboardingCompleted.channel,
      });

      revalidateAfterCheckout();
      return;
    }

    const remaining = pollingStartedAtRef.current
      ? POLLING_TIMEOUT_MS - (Date.now() - pollingStartedAtRef.current)
      : POLLING_TIMEOUT_MS;

    if (remaining <= 0) {
      pollingStartedAtRef.current = null;
      setIsPollingForPlan(false);
      isPollingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const timer = setTimeout(() => {
      pollingStartedAtRef.current = null;
      setIsPollingForPlan(false);
      isPollingRef.current = false;
      setIsSubmitting(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [isPollingForPlan, user?.team?.plan]);

  const createCheckoutMutation = useMutation(
    trpc.billing.createCheckout.mutationOptions(),
  );

  const handleStartTrial = async () => {
    try {
      setIsSubmitting(true);

      const planType =
        billingPeriod === "yearly" ? `${selectedPlan}_yearly` : selectedPlan;

      track({
        event: LogEvents.CheckoutStarted.name,
        channel: LogEvents.CheckoutStarted.channel,
        plan: selectedPlan,
        planType,
        currency,
      });

      const { url } = await createCheckoutMutation.mutateAsync({
        plan: selectedPlan,
        planType,
        embedOrigin: window.location.origin,
        currency,
        requireTrial: true,
      });

      const checkout = await PolarEmbedCheckout.create(url, { theme });
      checkoutInstanceRef.current = checkout;

      checkout.addEventListener("success", (event: any) => {
        event.preventDefault();

        track({
          event: LogEvents.CheckoutCompleted.name,
          channel: LogEvents.CheckoutCompleted.channel,
          plan: selectedPlan,
          planType,
          currency,
        });

        pollingStartedAtRef.current = Date.now();
        isPollingRef.current = true;
        setIsPollingForPlan(true);
      });

      checkout.addEventListener("close", () => {
        checkoutInstanceRef.current = null;
        if (!isPollingRef.current) {
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      const isTrialIneligible =
        (error as any)?.data?.code === "PRECONDITION_FAILED";

      toast({
        duration: 3500,
        title: "Something went wrong",
        description: isTrialIneligible
          ? "Your account is not eligible for a free trial."
          : "Please try again or contact support.",
      });

      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      key: "starter" as const,
      name: "Starter",
      description:
        "One business. Bank sync, invoicing, receipt matching, and exports to your accountant.",
      monthlyPrice: pricing.starter.monthly,
      yearlyPrice: pricing.starter.yearly,
    },
    {
      key: "pro" as const,
      name: "Pro",
      description:
        "Multiple users, deeper insights, custom categories, customer portal, and API access.",
      monthlyPrice: pricing.pro.monthly,
      yearlyPrice: pricing.pro.yearly,
      badge: "Most Popular",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-lg lg:text-xl font-serif"
        >
          You're all set — pick a plan
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          Try Midday free for 14 days. You won't be charged until your trial
          ends and you can{" "}
          <span className="underline underline-offset-4">cancel anytime</span>.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="space-y-4"
      >
        <div
          className="relative flex items-stretch bg-muted"
          style={{ width: "fit-content" }}
        >
          <button
            type="button"
            onClick={() => setBillingPeriod("yearly")}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors",
              billingPeriod === "yearly"
                ? "text-foreground bg-background border-border z-10"
                : "text-muted-foreground hover:text-foreground bg-muted border-transparent",
            )}
          >
            Yearly (Save 20%)
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors",
              billingPeriod === "monthly"
                ? "text-foreground bg-background border-border z-10"
                : "text-muted-foreground hover:text-foreground bg-muted border-transparent",
            )}
          >
            Monthly
          </button>
        </div>

        <div className="space-y-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.key;
            const price =
              billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => setSelectedPlan(plan.key)}
                className={cn(
                  "w-full text-left px-3.5 py-3 border transition-colors relative",
                  isSelected
                    ? "border-primary bg-background"
                    : "border-border bg-background hover:border-primary/50",
                )}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-3.5 -translate-y-1/2">
                    <div className="bg-background border border-primary px-2 rounded-full flex items-center h-5">
                      <span className="text-[10px] leading-none text-foreground">
                        {plan.badge}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-lg font-medium text-foreground">
                      {pricing.symbol}
                      {price}
                    </span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {billingPeriod === "yearly"
                      ? "When billed yearly"
                      : "When billed monthly"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 space-y-2">
          <SubmitButton
            onClick={handleStartTrial}
            isSubmitting={isSubmitting}
            className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Start trial
          </SubmitButton>
          <p className="text-center text-xs text-muted-foreground">
            No charge today · You'll be billed when your trial ends
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setCurrency("USD")}
            className={cn(
              "transition-colors",
              currency === "USD"
                ? "underline underline-offset-4"
                : "hover:text-foreground cursor-pointer",
            )}
          >
            USD
          </button>
          {" / "}
          <button
            type="button"
            onClick={() => setCurrency("EUR")}
            className={cn(
              "transition-colors",
              currency === "EUR"
                ? "underline underline-offset-4"
                : "hover:text-foreground cursor-pointer",
            )}
          >
            EUR
          </button>
          {" · Excl. tax"}
        </div>
      </motion.div>
    </div>
  );
}
