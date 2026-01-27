import { createRoot } from "react-dom/client";
import {
  ForecastChart,
  type ForecastHistoricalItem,
  type ForecastItem,
  type ForecastSummary,
} from "@/components/charts/forecast-chart";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

interface ForecastResult {
  historical: ForecastHistoricalItem[];
  forecast: ForecastItem[];
  summary: ForecastSummary;
  meta: {
    from: string;
    to: string;
    forecastMonths: number;
  };
}

function App() {
  return (
    <div className="p-4">
      <AppWrapper<ForecastResult>>
        {(result) => (
          <ForecastChart
            historical={result.historical}
            forecast={result.forecast}
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
