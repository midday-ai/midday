"use client";

import { cn } from "@midday/ui/cn";
import { SubmitButton } from "@midday/ui/submit-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Plans({
  discountPrice,
  teamId,
  canChooseStarterPlan,
}: {
  discountPrice?: number;
  teamId: string;
  canChooseStarterPlan: boolean;
}) {
  const isDesktop = isDesktopApp();
  const [isLoading, setIsLoading] = useState(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-7 w-full">
      {/* Starter Plan */}
      <div className="flex flex-col p-6 border bg-background">
        <h2 className="text-xl mb-2 text-left">Starter</h2>
        <div className="mt-1 flex items-baseline">
          <span className="text-2xl font-medium tracking-tight">$29</span>
          <span className="ml-1 text-xl font-medium">/mo</span>
          <span className="ml-2 text-xs text-muted-foreground">Excl. VAT</span>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-left text-[#878787] font-mono">
            INCLUDING
          </h3>
          <ul className="mt-4 space-y-2">
            <li className="flex items-start">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
              <span className="text-xs">Up to 10 invoices per month</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
              <span className="text-xs">1 Connected bank</span>
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
              <span className="text-xs">1 user</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 border-t-[1px] border-border pt-4">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/api/checkout?plan=starter&teamId=${teamId}&isDesktop=${isDesktop}&planType=starter`}
                  className={cn(
                    !canChooseStarterPlan && "opacity-50 cursor-default",
                  )}
                  onClick={(evt) => {
                    if (!canChooseStarterPlan) {
                      evt.preventDefault();
                      return;
                    }

                    setIsLoading(1);
                  }}
                >
                  <SubmitButton
                    variant="secondary"
                    className={cn(
                      "h-9 hover:bg-primary hover:text-secondary",
                      !canChooseStarterPlan && "pointer-events-none",
                    )}
                    isSubmitting={isLoading === 1}
                  >
                    Choose starter plan
                  </SubmitButton>
                </Link>
              </TooltipTrigger>
              {!canChooseStarterPlan && (
                <TooltipContent className="text-xs max-w-[300px]">
                  <p>
                    This plan is not applicable since you have exceeded the
                    limits for this subscription (users or bank connections).
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
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
              discountPrice && "line-through text-[#878787]",
            )}
          >
            $99
          </span>
          {discountPrice && (
            <span className="ml-1 text-2xl font-medium tracking-tight">
              ${discountPrice}
            </span>
          )}
          <span className="ml-1 text-xl font-medium">/mo</span>
          <span className="ml-2 text-xs text-muted-foreground">Excl. VAT</span>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-left text-[#878787] font-mono">
            INCLUDING
          </h3>
          <ul className="mt-4 space-y-2">
            <li className="flex items-start">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
              <span className="text-xs">Up to 50 invoices per month</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2" />
              <span className="text-xs">10 Connected banks</span>
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
          <Link
            href={`/api/checkout?plan=pro&teamId=${teamId}&isDesktop=${isDesktop}&planType=pro`}
          >
            <SubmitButton
              className="h-9"
              onClick={() => setIsLoading(2)}
              isSubmitting={isLoading === 2}
            >
              Choose pro plan
            </SubmitButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
