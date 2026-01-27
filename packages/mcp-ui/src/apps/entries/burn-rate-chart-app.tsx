import { createRoot } from "react-dom/client";
import { BurnRateChart, type BurnRateData } from "@/components/charts/burn-rate-chart";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

interface BurnRateResult {
  data: BurnRateData[];
  averageBurnRate: number;
  currency: string;
}

function App() {
  return (
    <div className="p-4">
      <AppWrapper<BurnRateResult>>
        {(result) => (
          <BurnRateChart
            data={result.data}
            currency={result.currency}
            height={320}
          />
        )}
      </AppWrapper>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
