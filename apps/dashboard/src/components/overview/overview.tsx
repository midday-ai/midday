"use client";

import { OverviewWidgets } from "./overeview-widgets";
import { OverviewHeader } from "./overview-header";

export function Overview() {
  return (
    <div className="flex flex-col gap-4">
      <OverviewHeader />
      <OverviewWidgets />
    </div>
  );
}
