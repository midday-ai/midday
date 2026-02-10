import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { isMonthlyBreakdownType } from "@/lib/metrics-breakdown-constants";
import { BalanceSheetCanvas } from "./balance-sheet-canvas";
import { CanvasErrorFallback } from "./base/canvas-error-fallback";
import { BurnRateCanvas } from "./burn-rate-canvas";
import { CashFlowCanvas } from "./cash-flow-canvas";
import { CategoryExpensesCanvas } from "./category-expenses-canvas";
import { ForecastCanvas } from "./forecast-canvas";
import { GrowthRateCanvas } from "./growth-rate-canvas";
import { HealthReportCanvas } from "./health-report-canvas";
import { InvoicePaymentCanvas } from "./invoice-payment-canvas";
import { MetricsBreakdownSummaryCanvas } from "./metrics-breakdown-summary-canvas";
import { ProfitCanvas } from "./profit-canvas";
import { RevenueCanvas } from "./revenue-canvas";
import { RunwayCanvas } from "./runway-canvas";
import { SpendingCanvas } from "./spending-canvas";
import { StressTestCanvas } from "./stress-test-canvas";
import { TaxSummaryCanvas } from "./tax-summary-canvas";

export function Canvas() {
  const [selectedType, setSelectedType] = useQueryState(
    "artifact-type",
    parseAsString,
  );

  const [data] = useArtifacts({
    value: selectedType,
    onChange: (v) => setSelectedType(v ?? null),
    exclude: ["chat-title", "suggestions"],
  });

  const renderCanvas = useCallback(() => {
    const activeType = data.activeType;

    // Handle monthly breakdown artifacts (pattern: breakdown-summary-canvas-YYYY-MM)
    if (activeType && isMonthlyBreakdownType(activeType)) {
      return <MetricsBreakdownSummaryCanvas />;
    }

    switch (activeType) {
      case "burn-rate-canvas":
        return <BurnRateCanvas />;
      case "revenue-canvas":
        return <RevenueCanvas />;
      case "profit-canvas":
        return <ProfitCanvas />;
      case "profit-analysis-canvas":
        return <ProfitCanvas />;
      case "growth-rate-canvas":
        return <GrowthRateCanvas />;
      case "runway-canvas":
        return <RunwayCanvas />;
      case "cash-flow-canvas":
        return <CashFlowCanvas />;
      case "balance-sheet-canvas":
        return <BalanceSheetCanvas />;
      case "category-expenses-canvas":
        return <CategoryExpensesCanvas />;
      case "health-report-canvas":
        return <HealthReportCanvas />;
      case "spending-canvas":
        return <SpendingCanvas />;
      case "forecast-canvas":
        return <ForecastCanvas />;
      case "tax-summary-canvas":
        return <TaxSummaryCanvas />;
      case "stress-test-canvas":
        return <StressTestCanvas />;
      case "invoice-payment-canvas":
        return <InvoicePaymentCanvas />;
      case "breakdown-summary-canvas":
        return <MetricsBreakdownSummaryCanvas />;
      default:
        return null;
    }
  }, [data.activeType]);

  return (
    <ErrorBoundary key={selectedType} fallback={<CanvasErrorFallback />}>
      {renderCanvas()}
    </ErrorBoundary>
  );
}
