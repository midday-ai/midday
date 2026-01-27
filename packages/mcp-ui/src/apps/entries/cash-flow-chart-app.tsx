import { createRoot } from "react-dom/client";
import {
  CashFlowChart,
  type CashFlowData,
  type CashFlowSummary,
} from "@/components/charts/cash-flow-chart";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

interface CashFlowResult {
  data: CashFlowData[];
  summary: CashFlowSummary;
  meta: {
    from: string;
    to: string;
    period: string;
  };
}

function App() {
  return (
    <div className="p-4">
      <AppWrapper<CashFlowResult>>
        {(result) => (
          <CashFlowChart
            data={result.data}
            summary={result.summary}
            currency={result.summary?.currency}
            height={320}
          />
        )}
      </AppWrapper>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
