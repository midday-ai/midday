"use client";

import { cn } from "@midday/ui/cn";
import { PlanCards } from "@midday/ui/plan-cards";
import { SubmitButton } from "@midday/ui/submit-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { revalidateAfterCheckout } from "@/actions/revalidate-action";
import { useTRPC } from "@/trpc/client";

const POLLING_TIMEOUT_MS = 30_000;

type PlansProps = {
  continent?: string;
};

export function Plans({ continent }: PlansProps) {
  const [isSubmitting, setIsSubmitting] = useState(0);
  const [isPollingForPlan, setIsPollingForPlan] = useState(false);
  const isPollingRef = useRef(false);
  const pollingStartedAtRef = useRef<number | null>(null);
  const trpc = useTRPC();
  const checkoutInstanceRef = useRef<Awaited<
    ReturnType<typeof PolarEmbedCheckout.create>
  > | null>(null);

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
  const { data, isLoading } = useQuery(trpc.team.availablePlans.queryOptions());
  const theme = useTheme().resolvedTheme === "dark" ? "dark" : "light";

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
    if (!isPollingForPlan) return;

    const isTimedOut =
      pollingStartedAtRef.current &&
      Date.now() - pollingStartedAtRef.current > POLLING_TIMEOUT_MS;
    const plan = user?.team?.plan;
    const planUpdated = plan != null && plan !== "trial";

    if (planUpdated || isTimedOut) {
      pollingStartedAtRef.current = null;
      setIsPollingForPlan(false);
      isPollingRef.current = false;

      if (isTimedOut && !planUpdated) {
        setIsSubmitting(0);
      }

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

      checkout.addEventListener("success", (event: any) => {
        event.preventDefault();
        pollingStartedAtRef.current = Date.now();
        isPollingRef.current = true;
        setIsPollingForPlan(true);
      });

      checkout.addEventListener("close", () => {
        checkoutInstanceRef.current = null;
        if (!isPollingRef.current) {
          setIsSubmitting(0);
        }
      });

      checkout.addEventListener("confirmed", () => {});
    } catch (error) {
      console.error("Failed to open checkout", error);
      setIsSubmitting(0);
    }
  };

  return (
    <PlanCards
      continent={continent}
      renderStarterAction={(billingPeriod) => (
        <>
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
                      billingPeriod === "yearly" ? "starter_yearly" : "starter",
                    );
                  }}
                  disabled={!isLoading && !data?.starter}
                >
                  Get Starter
                </SubmitButton>
              </div>
            </TooltipTrigger>
            {!isLoading && !data?.starter && (
              <TooltipContent className="text-xs max-w-[300px]">
                <p>
                  This plan is not applicable since you have exceeded the limits
                  for this subscription (users or bank connections).
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </>
      )}
      renderProAction={(billingPeriod) => (
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
          Get Pro
        </SubmitButton>
      )}
    />
  );
}
