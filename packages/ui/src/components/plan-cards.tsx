"use client";

import { getPlanPricing, type PlanFeature, planFeatures } from "@midday/plans";
import NumberFlow from "@number-flow/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

function FeatureRow({ label, tooltip }: PlanFeature) {
  const content = (
    <div className="flex items-start gap-2">
      <span className="text-foreground leading-[1.5rem]">•</span>
      <span
        className={cn(
          "font-sans text-sm text-foreground leading-relaxed",
          tooltip && "border-b border-dashed border-[#878787]/30 cursor-help",
        )}
      >
        {label}
      </span>
    </div>
  );

  if (!tooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent className="text-xs max-w-[280px]">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

type PlanCardsProps = {
  continent?: string;
  renderAction: (billingPeriod: "monthly" | "yearly") => ReactNode;
  onCurrencyChange?: (currency: "USD" | "EUR") => void;
  footnote?: string;
};

export function PlanCards({
  continent,
  renderAction,
  onCurrencyChange,
  footnote,
}: PlanCardsProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [currency, setCurrency] = useState<"USD" | "EUR">(() => {
    if (continent) {
      return getPlanPricing(continent).currency as "USD" | "EUR";
    }
    return "USD";
  });
  const pricing = getPlanPricing(currency === "EUR" ? "EU" : "NA");

  useEffect(() => {
    if (continent) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz?.startsWith("Europe/")) {
        setCurrency("EUR");
        onCurrencyChange?.("EUR");
      }
    } catch {}
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full">
        <div className="flex justify-center mb-6 sm:mb-6 lg:mb-12">
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

        <div className="w-full max-w-[500px] mx-auto">
          <div className="bg-background border border-border p-4 py-6 flex flex-col">
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-2xl text-foreground">
                  {pricing.symbol}
                  <NumberFlow
                    value={
                      billingPeriod === "monthly"
                        ? pricing.starter.monthly
                        : pricing.starter.yearly
                    }
                    willChange
                  />
                </span>
                <span className="font-sans text-sm text-muted-foreground">
                  /month
                </span>
              </div>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                {billingPeriod === "monthly"
                  ? "Billed monthly"
                  : `${pricing.symbol}${pricing.starter.yearly * 12}/year · billed annually`}
              </p>
            </div>

            <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
              {planFeatures.map((f) => (
                <FeatureRow key={f.label} {...f} />
              ))}
            </div>

            <div className="space-y-3">{renderAction(billingPeriod)}</div>
          </div>
        </div>

        <p className="font-sans text-xs text-muted-foreground/50 mt-6 text-center">
          {footnote && <>{footnote} · </>}
          {billingPeriod === "yearly" && <>30-day money-back guarantee · </>}
          <button
            type="button"
            onClick={() => {
              if (currency !== "USD") {
                setCurrency("USD");
                onCurrencyChange?.("USD");
              }
            }}
            className={cn(
              "transition-colors",
              currency === "USD"
                ? "text-foreground underline underline-offset-4"
                : "text-muted-foreground/50 hover:text-muted-foreground cursor-pointer",
            )}
          >
            USD
          </button>
          {" / "}
          <button
            type="button"
            onClick={() => {
              if (currency !== "EUR") {
                setCurrency("EUR");
                onCurrencyChange?.("EUR");
              }
            }}
            className={cn(
              "transition-colors",
              currency === "EUR"
                ? "text-foreground underline underline-offset-4"
                : "text-muted-foreground/50 hover:text-muted-foreground cursor-pointer",
            )}
          >
            EUR
          </button>
          {" · Excl. tax · Fair usage policy"}
        </p>
      </div>
    </TooltipProvider>
  );
}
