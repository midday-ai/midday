import { type CanvasType, useCanvasState } from "@/hooks/use-canvas-state";
import { BalanceSheetCanvas } from "./balance-sheet-canvas";
import { BurnRateCanvas } from "./burn-rate-canvas";
import { CashFlowCanvas } from "./cash-flow-canvas";
import { CategoryExpensesCanvas } from "./category-expenses-canvas";
import { ExpensesCanvas } from "./expenses-canvas";
import { HealthReportCanvas } from "./health-report-canvas";
import { ProfitAnalysisCanvas } from "./profit-analysis-canvas";
import { ProfitCanvas } from "./profit-canvas";
import { RevenueCanvas } from "./revenue-canvas";
import { RunwayCanvas } from "./runway-canvas";
import { SpendingCanvas } from "./spending-canvas";

export function Canvas() {
  const { canvasType } = useCanvasState();
  switch (canvasType) {
    case "burn-rate-canvas":
      return <BurnRateCanvas />;
    case "revenue-canvas":
      return <RevenueCanvas />;
    case "profit-canvas":
      return <ProfitCanvas />;
    case "expenses-canvas":
      return <ExpensesCanvas />;
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
    default:
      return <BurnRateCanvas />;
  }
}
