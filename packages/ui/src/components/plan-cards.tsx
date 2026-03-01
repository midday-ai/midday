"use client";

import {
  getPlanPricing,
  type PlanFeature,
  proFeatures,
  starterFeatures,
} from "@midday/plans";
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
  renderStarterAction: (billingPeriod: "monthly" | "yearly") => ReactNode;
  renderProAction: (billingPeriod: "monthly" | "yearly") => ReactNode;
  onCurrencyChange?: (currency: "USD" | "EUR") => void;
  footnote?: string;
};

export function PlanCards({
  continent,
  renderStarterAction,
  renderProAction,
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 w-full max-w-[800px] mx-auto">
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
                  {pricing.symbol}
                  <NumberFlow
                    value={
                      billingPeriod === "monthly"
                        ? pricing.starter.monthly
                        : pricing.starter.yearly * 12
                    }
                    willChange
                  />
                </span>
                <span className="font-sans text-sm text-muted-foreground">
                  {billingPeriod === "monthly" ? "/month" : "/year"}
                </span>
              </div>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                {billingPeriod === "monthly"
                  ? "Billed monthly"
                  : `Save ${pricing.symbol}${(pricing.starter.monthly - pricing.starter.yearly) * 12}/year vs monthly`}
              </p>
            </div>

            <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
              {starterFeatures.map((f) => (
                <FeatureRow key={f.label} {...f} />
              ))}
            </div>

            <div className="space-y-3">
              {renderStarterAction(billingPeriod)}
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
                  {pricing.symbol}
                  <NumberFlow
                    value={
                      billingPeriod === "monthly"
                        ? pricing.pro.monthly
                        : pricing.pro.yearly * 12
                    }
                    willChange
                  />
                </span>
                <span className="font-sans text-sm text-muted-foreground">
                  {billingPeriod === "monthly" ? "/month" : "/year"}
                </span>
              </div>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                {billingPeriod === "monthly"
                  ? "Billed monthly"
                  : `Save ${pricing.symbol}${(pricing.pro.monthly - pricing.pro.yearly) * 12}/year vs monthly`}
              </p>
            </div>

            <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
              {proFeatures.map((f) => (
                <FeatureRow key={f.label} {...f} />
              ))}
            </div>

            <div className="space-y-3">{renderProAction(billingPeriod)}</div>
          </div>
        </div>

        <p className="font-sans text-xs text-muted-foreground mt-6 text-center">
          {footnote && <>{footnote} · </>}
          {billingPeriod === "yearly" && <>30-day money-back guarantee · </>}
          Prices in{" "}
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
                ? "text-foreground"
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
                ? "text-foreground"
                : "text-muted-foreground/50 hover:text-muted-foreground cursor-pointer",
            )}
          >
            EUR
          </button>{" "}
          · Prices exclude tax
        </p>
      </div>
    </TooltipProvider>
  );
}
