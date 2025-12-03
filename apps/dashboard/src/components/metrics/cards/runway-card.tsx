"use client";

import { RunwayChart } from "@/components/charts/runway-chart";
import { useLongPress } from "@/hooks/use-long-press";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useOverviewTab } from "@/hooks/use-overview-tab";
import { useUserQuery } from "@/hooks/use-user";
import { useChatStore } from "@/store/chat";
import { useTRPC } from "@/trpc/client";
import { generateChartSelectionMessage } from "@/utils/chart-selection-message";
import { cn } from "@midday/ui/cn";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { ShareMetricButton } from "../components/share-metric-button";

interface RunwayCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
}

export function RunwayCard({ from, to, currency, locale }: RunwayCardProps) {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const { isMetricsTab } = useOverviewTab();
  const { isCustomizing, setIsCustomizing } = useMetricsCustomize();
  const setInput = useChatStore((state) => state.setInput);
  const [isSelecting, setIsSelecting] = useState(false);

  const longPressHandlers = useLongPress({
    onLongPress: () => setIsCustomizing(true),
    threshold: 500,
    disabled: isCustomizing || isSelecting,
  });
  const [displayRunway, setDisplayRunway] = useState<number>(0);
  const displayRunwayRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);

  const { data: runwayData } = useQuery({
    ...trpc.reports.runway.queryOptions({
      from,
      to,
      currency: currency,
    }),
    enabled: isMetricsTab,
  });

  // Fetch cash balance for runway chart
  const { data: cashBalanceData } = useQuery({
    ...trpc.widgets.getAccountBalances.queryOptions({
      currency: currency,
    }),
    enabled: isMetricsTab,
  });

  // Fetch burn rate data for calculations
  const { data: burnRateData } = useQuery({
    ...trpc.reports.burnRate.queryOptions({
      from,
      to,
      currency: currency,
    }),
    enabled: isMetricsTab,
  });

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
    if (!runwayData || typeof runwayData !== "number") {
      return [];
    }

    const burnRateAvg =
      burnRateData && burnRateData.length > 0
        ? burnRateData.reduce((sum, item) => sum + item.value, 0) /
          burnRateData.length
        : 0;

    // Return empty array if burn rate is 0 or invalid
    if (burnRateAvg <= 0 || !Number.isFinite(burnRateAvg)) {
      return [];
    }

    // Get current cash balance from account balances or estimate from runway
    const currentCashBalance =
      cashBalanceData?.result?.totalBalance ?? runwayData * burnRateAvg;

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
        currentCashBalance - burnRateAvg * monthsFromNow,
      );
      const projectedRunwayMonths =
        burnRateAvg > 0 ? remainingCash / burnRateAvg : 0;

      // Skip if runwayMonths is invalid
      if (!Number.isFinite(projectedRunwayMonths)) continue;

      projections.push({
        month: i === 0 ? "Now" : `+${i}mo`,
        cashRemaining: remainingCash,
        burnRate: burnRateAvg,
        projectedCash: i > 0 ? remainingCash : undefined,
        runwayMonths: projectedRunwayMonths,
      });

      // Stop adding projections once runway reaches 0
      if (projectedRunwayMonths <= 0) break;
    }

    return projections;
  }, [runwayData, burnRateData, cashBalanceData]);

  const currentRunway = typeof runwayData === "number" ? runwayData : 0;

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

  const dateRangeDisplay = useMemo(() => {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;
    } catch {
      return "";
    }
  }, [from, to]);

  // Check if we have no data due to missing bank accounts or cash balance
  const hasNoData = runwayChartData.length === 0;

  return (
    <div
      className={cn(
        "border bg-background border-border p-6 flex flex-col h-full relative group",
        !isCustomizing && "cursor-pointer",
      )}
      {...longPressHandlers}
    >
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">Runway</h3>
          <div className="opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity">
            <ShareMetricButton
              type="runway"
              from={from}
              to={to}
              currency={currency}
            />
          </div>
        </div>
        <p className="text-3xl font-normal">
          <NumberFlow
            value={displayRunway}
            format={{
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }}
            willChange
            locales={locale || user?.locale || "en"}
          />{" "}
          months
        </p>
        <p className="text-xs mt-1 text-muted-foreground">{dateRangeDisplay}</p>
      </div>
      <div className="h-80">
        {hasNoData ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground -mt-10">
            No balance data available.
          </div>
        ) : (
          <RunwayChart
            data={runwayChartData}
            height={320}
            currency={currency}
            locale={locale}
            displayMode="months"
            enableSelection={true}
            onSelectionStateChange={setIsSelecting}
            onSelectionComplete={(startDate, endDate, chartType) => {
              const message = generateChartSelectionMessage(
                startDate,
                endDate,
                chartType,
              );
              setInput(message);
            }}
          />
        )}
      </div>
    </div>
  );
}
