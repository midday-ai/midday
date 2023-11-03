import { Suspense } from "react";
import { ChartSelector } from "./chart-selector";

export function Summary() {
  return (
    <div className="flex justify-between pb-14 items-end">
      <div>
        <Suspense>
          <ChartSelector />
        </Suspense>

        <h1 className="text-3xl mb-1">€437,109.45</h1>
        <p className="text-sm text-[#606060]">vs $3,437,152.32 last period</p>
      </div>

      <div className="flex space-x-4">
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#F5F5F3]" />
          <span className="text-sm text-[#606060]">Chosen Period</span>
        </div>
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#606060]" />
          <span className="text-sm text-[#606060]">Last Period</span>
        </div>
      </div>
    </div>
  );
}
