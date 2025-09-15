"use client";

import { SuggestedActions } from "../suggested-actions";
import { OverviewWidgets } from "./overeview-widgets";

export function Overview() {
  return (
    <div className="flex flex-col gap-4 mt-[130px]">
      <OverviewWidgets />
      <SuggestedActions />
    </div>
  );
}
