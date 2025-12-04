"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { isDesktopApp } from "@midday/desktop-client/platform";
import { cn } from "@midday/ui/cn";
import { SubmitButton } from "@midday/ui/submit-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Plans() {
  const isDesktop = isDesktopApp();
  const [isSubmitting, setIsSubmitting] = useState(0);
  const trpc = useTRPC();
  const router = useRouter();
  const checkoutInstanceRef = useRef<Awaited<
    ReturnType<typeof PolarEmbedCheckout.create>
  > | null>(null);

  const { data: user } = useUserQuery();
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

  const handleCheckout = async (plan: "starter" | "pro", planType: string) => {
    try {
      setIsSubmitting(plan === "starter" ? 1 : 2);

      // Fetch checkout URL from API
      const checkoutUrl = new URL("/api/checkout", window.location.origin);
      checkoutUrl.searchParams.set("plan", plan);
      checkoutUrl.searchParams.set("teamId", user?.team?.id || "");
      checkoutUrl.searchParams.set("isDesktop", String(isDesktop));
      checkoutUrl.searchParams.set("planType", planType);
      checkoutUrl.searchParams.set("embedOrigin", "true");

      const response = await fetch(checkoutUrl.toString());
      if (!response.ok) {
        throw new Error("Failed to create checkout");
      }

      const { url } = await response.json();

      const checkout = await PolarEmbedCheckout.create(url, theme);
      checkoutInstanceRef.current = checkout;

      // Handle checkout events
      checkout.addEventListener("success", (event: any) => {
        // Prevent Polar's automatic redirect
        event.preventDefault();
        // Refresh the page to show updated plan status
        router.refresh();
      });

      checkout.addEventListener("close", () => {
        checkoutInstanceRef.current = null;
        setIsSubmitting(0);
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
