import * as React from "react";
import { Spending } from "./charts/spending";
import { Transactions } from "./charts/transactions";
import { Inbox } from "./widgets/inbox";
import { Insights } from "./widgets/insights";
import { Tracker } from "./widgets/tracker";

type Props = {
  disabled: boolean;
  initialPeriod: any;
  searchParams: any;
};

export function Widgets({ disabled, initialPeriod, searchParams }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 2xl:gap-8 xl:grid-cols-3">
      <Insights />
      <Spending disabled={disabled} initialPeriod={initialPeriod} />
      <Tracker date={searchParams?.date} hideDaysIndicators />

      <Transactions disabled={disabled} />
      <Inbox disabled={disabled} />
    </div>
  );
}
