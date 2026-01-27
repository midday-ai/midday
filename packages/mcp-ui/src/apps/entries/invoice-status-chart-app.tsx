import { createRoot } from "react-dom/client";
import {
  InvoiceStatusChart,
  type InvoiceStatusSummary,
} from "@/components/charts/invoice-status-chart";
import { AppWrapper } from "@/apps/app-wrapper";
import "@/styles/globals.css";

function App() {
  return (
    <div className="p-4">
      <AppWrapper<InvoiceStatusSummary>>
        {(result) => (
          <InvoiceStatusChart
            summary={result}
            height={320}
          />
        )}
      </AppWrapper>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
