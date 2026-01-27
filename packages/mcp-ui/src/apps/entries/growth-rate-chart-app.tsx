import { createRoot } from "react-dom/client";
import {
  GrowthRateChart,
  type GrowthRateSummary,
  type GrowthRateResult,
} from "@/components/charts/growth-rate-chart";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

interface GrowthRateResponse {
  summary: GrowthRateSummary;
  result: GrowthRateResult;
  meta: {
    from: string;
    to: string;
    period: string;
    type: string;
  };
}

function App() {
  return (
    <div className="p-4">
      <AppWrapper<GrowthRateResponse>>
        {(result) => (
          <GrowthRateChart
            summary={result.summary}
            result={result.result}
            currency={result.summary?.currency}
            height={280}
          />
        )}
      </AppWrapper>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
