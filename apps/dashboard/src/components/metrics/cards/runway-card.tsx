"use client";

import { UTCDate } from "@date-fns/utc";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { RunwayChart } from "@/components/charts/runway-chart";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { ChartFadeIn } from "../components/chart-loading-overlay";
import { DragIndicator } from "../components/drag-indicator";
import { ShareMetricButton } from "../components/share-metric-button";

interface RunwayCardProps {
  currency?: string;
  locale?: string;
  isCustomizing?: boolean;
}

export function RunwayCard({
  currency,
  locale,
  isCustomizing,
}: RunwayCardProps) {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const [displayRunway, setDisplayRunway] = useState<number>(0);
  const displayRunwayRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);

  // Date window used by ShareMetricButton to create shared report links.
  const burnRateWindow = useMemo(() => {
    const to = endOfMonth(new UTCDate());
    const from = startOfMonth(subMonths(to, 5));
    return {
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
    };
  }, []);

  const { data: runwayData, isPending: isRunwayPending } = useQuery(
    trpc.reports.runway.queryOptions({
      currency: currency,
    }),
  );

  const { data: cashBalanceData, isPending: isBalancePending } = useQuery(
    trpc.reports.getAccountBalances.queryOptions({
      currency: currency,
    }),
  );

  const isAnyPending = isRunwayPending || isBalancePending;

  // Transform runway data - need to calculate monthly projections
  const runwayChartData = useMemo<
    Array<{
      month: string;
      cashRemaining: number;
      burnRate: number;
      projectedCash?: number;
      runwayMonths: number;
    }>
  >(() => {
    if (!runwayData || typeof runwayData !== "object") {
      return [];
    }

    const { months: runwayMonths, medianBurn } = runwayData;

    if (medianBurn <= 0 || !Number.isFinite(medianBurn)) {
      return [];
    }

    const currentCashBalance =
      cashBalanceData?.result?.totalBalance ?? runwayMonths * medianBurn;

    // Return empty array if cash balance is invalid (but allow 0 for edge cases)
    if (!Number.isFinite(currentCashBalance)) {
      return [];
    }

    // Generate monthly projections
    const projections: Array<{
      month: string;
      cashRemaining: number;
      burnRate: number;
      projectedCash?: number;
      runwayMonths: number;
    }> = [];

    for (let i = 0; i <= 8; i++) {
      const monthsFromNow = i;
      const remainingCash = Math.max(
        0,
        currentCashBalance - medianBurn * monthsFromNow,
      );
      const projectedRunwayMonths =
        medianBurn > 0 ? remainingCash / medianBurn : 0;

      if (!Number.isFinite(projectedRunwayMonths)) continue;

      projections.push({
        month: i === 0 ? "Now" : `+${i}mo`,
        cashRemaining: remainingCash,
        burnRate: medianBurn,
        projectedCash: i > 0 ? remainingCash : undefined,
        runwayMonths: projectedRunwayMonths,
      });

      if (projectedRunwayMonths <= 0) break;
    }

    return projections;
  }, [runwayData, cashBalanceData]);

  const currentRunway =
    runwayData && typeof runwayData === "object" ? runwayData.months : 0;

  // Update display value when runway data changes
  // Note: 0 is a legitimate value (zero runway means no months of cash remaining)
  useEffect(() => {
    if (
      currentRunway !== undefined &&
      currentRunway !== null &&
      !Number.isNaN(currentRunway)
    ) {
      if (!hasInitializedRef.current) {
        displayRunwayRef.current = currentRunway;
        setDisplayRunway(currentRunway);
        hasInitializedRef.current = true;
        return;
      }

      // Always update to the current value, including 0 (which is legitimate)
      displayRunwayRef.current = currentRunway;
      setDisplayRunway(currentRunway);
    }
    // If currentRunway is undefined/null/NaN, preserve the previous value (this indicates loading)
  }, [currentRunway]);

  // Check if we have no data due to missing bank accounts or cash balance
  const hasNoData = runwayChartData.length === 0;

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full relative group">
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">Runway</h3>
          <div
            className={
              isCustomizing
                ? ""
                : "opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity"
            }
          >
            {isCustomizing ? (
              <DragIndicator />
            ) : (
              <ShareMetricButton
                type="runway"
                from={burnRateWindow.from}
                to={burnRateWindow.to}
                currency={currency}
              />
            )}
          </div>
        </div>
        <p className="text-3xl font-normal">
          <NumberFlow
            value={displayRunway}
            animated={hasInitializedRef.current}
            format={{
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }}
            willChange
            locales={locale || user?.locale || "en"}
          />{" "}
          months
        </p>
        <p className="text-xs mt-1 text-muted-foreground">
          Based on last 3 months
        </p>
      </div>
      <div className="h-80">
        {!hasNoData ? (
          <ChartFadeIn>
            <RunwayChart
              data={runwayChartData}
              height={320}
              currency={currency}
              locale={locale}
              displayMode="months"
            />
          </ChartFadeIn>
        ) : isAnyPending ? null : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground -mt-10">
            No balance data available.
          </div>
        )}
      </div>
    </div>
  );
}
