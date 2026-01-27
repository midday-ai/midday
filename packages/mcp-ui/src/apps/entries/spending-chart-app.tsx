import { createRoot } from "react-dom/client";
import { SpendingChart, type SpendingData } from "@/components/charts/spending-chart";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

interface SpendingResult {
  data: SpendingData[];
  meta: {
    from: string;
    to: string;
    currency: string;
  };
}

function App() {
  return (
    <div className="p-4">
      <AppWrapper<SpendingResult>>
        {(result) => (
          <SpendingChart
            data={result.data}
            currency={result.meta?.currency}
            height={320}
          />
        )}
      </AppWrapper>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
