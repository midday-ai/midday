import { InsightsWidget } from "./insights-widget";

export function Insights() {
  return (
    <div className="flex-1 border p-8 relative h-full">
      <h2 className="text-lg">Insights</h2>
      <div className="h-full">
        <InsightsWidget />
      </div>
    </div>
  );
}
