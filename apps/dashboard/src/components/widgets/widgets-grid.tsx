"use client";

import { RunwayWidget } from "./runway";
import { TopCustomerWidget } from "./top-customer";

export function WidgetsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <RunwayWidget />

      <TopCustomerWidget />

      {/* File Management */}
      <div className="h-44 border p-6 col-span-1" />

      {/* Monthly Spending */}
      <div className="h-44 border p-6 col-span-1" />

      {/* Outstanding Invoices */}
      <div className="h-44 border p-6 col-span-1" />

      {/* Profit Analysis */}
      <div className="h-44 border p-6 col-span-1" />

      {/* Account Balance */}
      <div className="h-44 border p-6 col-span-1" />

      {/* Software Costs */}
      <div className="h-44 border p-6 col-span-1" />
    </div>
  );
}
