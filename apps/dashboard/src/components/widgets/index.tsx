"use client";

import { SuggestedActions } from "../suggested-actions";
import { WidgetsHeader } from "./header";
import { WidgetsGrid } from "./widgets-grid";

export function Widgets() {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <WidgetsHeader />
      <WidgetsGrid />
      <SuggestedActions />
    </div>
  );
}
