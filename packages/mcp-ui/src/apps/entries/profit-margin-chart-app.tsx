import { createRoot } from "react-dom/client";
import {
  ProfitMarginChart,
  type ProfitMarginDataItem,
  type ProfitMarginSummary,
} from "@/components/charts/profit-margin-chart";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

interface ProfitMarginResult {
  data: ProfitMarginDataItem[];
  summary: ProfitMarginSummary;
  meta: {
    from: string;
    to: string;
    type: string;
  };
}

function App() {
  return (
    <div className="p-4">
      <AppWrapper<ProfitMarginResult>>
        {(result) => (
          <ProfitMarginChart
            data={result.data}
            summary={result.summary}
            height={320}
          />
        )}
      </AppWrapper>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
