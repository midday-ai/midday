import { createRoot } from "react-dom/client";
import {
  RevenueChart,
  type RevenueResultItem,
  type RevenueSummary,
} from "@/components/charts/revenue-chart";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

interface RevenueResult {
  result: RevenueResultItem[];
  summary: RevenueSummary;
  meta: {
    from: string;
    to: string;
    type: string;
  };
}

function App() {
  return (
    <div className="p-4">
      <AppWrapper<RevenueResult>>
        {(result) => (
          <RevenueChart
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
