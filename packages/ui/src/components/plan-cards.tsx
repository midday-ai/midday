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
  const text = (
    <span
      className={cn(
        "font-sans text-sm text-foreground font-normal",
        tooltip && "border-b border-dashed border-[#878787]/30 cursor-help",
      )}
    >
      {label}
    </span>
  );

  const content = (
    <div className="flex items-center gap-2 h-7">
      <span className="text-foreground shrink-0 leading-none">•</span>
      {text}
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

function IncludedSection() {
  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 max-w-fit mx-auto">
        {planFeatures.map((f) => (
          <FeatureRow key={f.label} {...f} />
        ))}
      </div>
    </div>
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
      <div className="w-full max-w-[560px] mx-auto">
        <div className="border border-border p-6 sm:p-8 lg:p-10">
        <div className="flex justify-center mb-10">
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

        <div className="text-center mb-10">
          <div className="flex items-baseline justify-center gap-3">
            <span className="font-sans text-[80px] leading-none text-foreground font-light tracking-tight">
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
            <span className="font-sans text-lg text-muted-foreground">
              /month
            </span>
          </div>
          <p className="font-sans text-sm text-muted-foreground mt-3">
            {billingPeriod === "monthly"
              ? "Billed monthly"
              : `${pricing.symbol}${pricing.starter.yearly * 12}/year · billed annually`}
          </p>
        </div>

        <div className="max-w-[280px] mx-auto">
          {renderAction(billingPeriod)}
        </div>

        <IncludedSection />

        </div>
        <p className="font-sans text-xs text-muted-foreground mt-8 text-center">
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
                ? "text-muted-foreground underline underline-offset-4"
                : "text-muted-foreground hover:text-foreground cursor-pointer",
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
                ? "text-muted-foreground underline underline-offset-4"
                : "text-muted-foreground hover:text-foreground cursor-pointer",
            )}
          >
            EUR
          </button>
          {" · Excl. tax"}
        </p>
      </div>
    </TooltipProvider>
  );
}
