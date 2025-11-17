import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { BalanceSheetCanvas } from "./balance-sheet-canvas";
import { BurnRateCanvas } from "./burn-rate-canvas";
import { CashFlowCanvas } from "./cash-flow-canvas";
import { CategoryExpensesCanvas } from "./category-expenses-canvas";
import { ForecastCanvas } from "./forecast-canvas";
import { HealthReportCanvas } from "./health-report-canvas";
import { InvoicePaymentCanvas } from "./invoice-payment-canvas";
import { ProfitAnalysisCanvas } from "./profit-analysis-canvas";
import { ProfitCanvas } from "./profit-canvas";
import { RevenueCanvas } from "./revenue-canvas";
import { RunwayCanvas } from "./runway-canvas";
import { SpendingCanvas } from "./spending-canvas";
import { StressTestCanvas } from "./stress-test-canvas";
import { TaxSummaryCanvas } from "./tax-summary-canvas";

export function Canvas() {
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });

  switch (current?.type) {
    case "burn-rate-canvas":
      return <BurnRateCanvas />;
    case "revenue-canvas":
      return <RevenueCanvas />;
    case "profit-canvas":
      return <ProfitCanvas />;
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
    case "profit-analysis-canvas":
      return <ProfitAnalysisCanvas />;
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
    default:
      return null;
  }
}
