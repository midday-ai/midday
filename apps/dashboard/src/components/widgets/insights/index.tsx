import { Suspense } from "react";
import { InsightsWidget } from "./insights-widget";

export function Insights() {
  return (
    <div className="border aspect-square overflow-hidden relative flex flex-col p-4 md:p-8">
      <h2 className="text-lg">Assistant</h2>

      {/* <div className="flex flex-1 flex-col justify-center items-center"> */}
      <Suspense>
        <InsightsWidget />
      </Suspense>
      {/* </div> */}
    </div>
  );
}
