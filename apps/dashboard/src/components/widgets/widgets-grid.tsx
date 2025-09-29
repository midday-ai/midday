"use client";

import { CashFlowWidget } from "./cash-flow";
import { GrowthRateWidget } from "./growth-rate";
import { InboxWidget } from "./inbox";
import { OutstandingInvoicesWidget } from "./outstanding-invoices";
import { ProfitMarginWidget } from "./profit-margin";
import { RevenueSummaryWidget } from "./revenue-summary";
import { RunwayWidget } from "./runway";
import { TopCustomerWidget } from "./top-customer";

export function WidgetsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
      <RunwayWidget />

      <TopCustomerWidget />

      <RevenueSummaryWidget />

      <GrowthRateWidget />

      <ProfitMarginWidget />

      <CashFlowWidget />

      <OutstandingInvoicesWidget />

      <InboxWidget />
    </div>
  );
}
