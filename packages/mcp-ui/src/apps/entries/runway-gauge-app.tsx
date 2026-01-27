import { createRoot } from "react-dom/client";
import { RunwayGauge } from "@/components/charts/runway-gauge";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

interface RunwayResult {
  months: number;
  totalBalance: number;
  averageBurnRate: number;
  currency: string;
}

function App() {
  return (
    <div className="p-4">
      <AppWrapper<RunwayResult>>
        {(result) => (
          <RunwayGauge
            months={result.months}
            height={300}
          />
        )}
      </AppWrapper>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
