import { createRoot } from "react-dom/client";
import {
  ProfitChart,
  type ProfitResultItem,
  type ProfitSummary,
} from "@/components/charts/profit-chart";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

interface ProfitResult {
  result: ProfitResultItem[];
  summary: ProfitSummary;
  meta: {
    from: string;
    to: string;
    type: string;
  };
}

function App() {
  return (
    <div className="p-4">
      <AppWrapper<ProfitResult>>
        {(result) => (
          <ProfitChart
            data={result.result}
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
