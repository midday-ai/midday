"use client";

import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function TaxSummaryWidget() {
  const trpc = useTRPC();
  const router = useRouter();

  const now = new Date();

  // Get current month data for net position
  const { data: monthData } = useQuery({
    ...trpc.widgets.getTaxSummary.queryOptions({
      from: format(startOfMonth(now), "yyyy-MM-dd"),
      to: format(endOfMonth(now), "yyyy-MM-dd"),
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  // Get year-to-date data for estimated annual obligation
  const { data: yearData } = useQuery({
    ...trpc.widgets.getTaxSummary.queryOptions({
      from: format(startOfYear(now), "yyyy-MM-dd"),
      to: format(endOfYear(now), "yyyy-MM-dd"),
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const taxData = monthData?.result;
  const ytdTaxData = yearData?.result;

  const getNetAmount = () => {
    if (!taxData) return 0;
    return taxData.collected.totalTaxAmount - taxData.paid.totalTaxAmount;
  };

  const netAmount = getNetAmount();
  const isOwed = netAmount > 0;

  // Calculate estimated annual tax based on YTD
  const estimatedDue = ytdTaxData
    ? ytdTaxData.collected.totalTaxAmount - ytdTaxData.paid.totalTaxAmount
    : 0;

  const getDescription = () => {
    if (!taxData) {
      return "Track VAT and sales tax obligations";
    }

    const { paid, collected } = taxData;

    if (collected.totalTaxAmount === 0 && paid.totalTaxAmount === 0) {
      return "No tax activity this month";
    }

    const totalActivity =
      Math.abs(collected.totalTaxAmount) + Math.abs(paid.totalTaxAmount);
    const collectedPercentage =
      totalActivity > 0
        ? (Math.abs(collected.totalTaxAmount) / totalActivity) * 100
        : 50;

    const collectedStr = formatAmount({
      amount: Math.abs(collected.totalTaxAmount),
      currency: taxData.currency,
    });
    const paidStr = formatAmount({
      amount: Math.abs(paid.totalTaxAmount),
      currency: taxData.currency,
    });

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Collected {collectedStr}</span>
          <span>Paid {paidStr}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${collectedPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  const handleOpenAssistant = () => {
    // Open assistant with tax context
    router.push("/");
    // Could trigger assistant modal here
  };

  return (
    <BaseWidget
      title="Tax Summary"
      icon={<Icons.ReceiptLong className="size-4" />}
      description={getDescription()}
      onClick={handleOpenAssistant}
      actions="Open taxes assistant"
    >
      {taxData &&
        (taxData.collected.totalTaxAmount > 0 ||
          taxData.paid.totalTaxAmount > 0) && (
          <div className="flex flex-col gap-4">
            {/* Current period net position */}
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-medium">
                  {formatAmount({
                    amount: Math.abs(netAmount),
                    currency: taxData.currency,
                  })}
                </span>
                {netAmount !== 0 && (
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-md",
                      isOwed
                        ? "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400"
                        : "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400",
                    )}
                  >
                    {isOwed ? "To Remit" : "Credit"}
                  </span>
                )}
              </div>

              {netAmount === 0 && (
                <p className="text-xs text-muted-foreground">
                  Balanced - no net tax position
                </p>
              )}
            </div>

            {/* Estimated due section */}
            {estimatedDue > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Estimated due (YTD)
                  </span>
                  <span className="text-sm font-medium">
                    {formatAmount({
                      amount: estimatedDue,
                      currency: taxData.currency,
                    })}
                  </span>
                </div>
                {/* Progress bar showing months elapsed */}
                <div className="space-y-1">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${((now.getMonth() + 1) / 12) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {now.getMonth() + 1} of 12 months elapsed
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
    </BaseWidget>
  );
}
