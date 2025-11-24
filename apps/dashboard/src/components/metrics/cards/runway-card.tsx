"use client";

import { RunwayChart } from "@/components/charts/runway-chart";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";

interface RunwayCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
}

export function RunwayCard({
  from,
  to,
  currency = "USD",
  locale,
  isCustomizing,
  wiggleClass,
}: RunwayCardProps) {
  const trpc = useTRPC();

  const { data: runwayData } = useQuery(
    trpc.reports.runway.queryOptions({
      from,
      to,
      currency,
    }),
  );

  // Fetch cash balance for runway chart
  const { data: cashBalanceData } = useQuery(
    trpc.widgets.getAccountBalances.queryOptions({
      currency,
    }),
  );

  // Fetch burn rate data for calculations
  const { data: burnRateData } = useQuery(
    trpc.reports.burnRate.queryOptions({
      from,
      to,
      currency,
    }),
  );

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
        month: i === 0 ? "Now" : `+${i}M`,
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

  const dateRangeDisplay = useMemo(() => {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;
    } catch {
      return "";
    }
  }, [from, to]);

  return (
    <div className="border bg-background border-border p-6">
      <div className="mb-4">
        <h3 className="text-sm font-normal mb-1 text-muted-foreground">
          Runway
        </h3>
        <p className="text-3xl font-normal">
          {currentRunway.toFixed(1)} months
        </p>
        <p className="text-xs mt-1 text-muted-foreground">
          {dateRangeDisplay}
        </p>
      </div>
      <div className="h-80">
        <RunwayChart
          data={runwayChartData}
          height={320}
          currency={currency}
          locale={locale}
          displayMode="months"
        />
      </div>
    </div>
  );
}

