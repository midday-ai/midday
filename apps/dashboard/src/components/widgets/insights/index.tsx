import { Card } from "@midday/ui/card";
import { Suspense } from "react";
import { InsightsWidget } from "./insights-widget";

export function Insights() {
  return (
    <Card className="aspect-square overflow-hidden relative flex flex-col p-4 md:p-8 rounded-2xl">
      <h2 className="text-lg">Assistant</h2>

      <Suspense>
        <InsightsWidget />
      </Suspense>
    </Card>
  );
}
