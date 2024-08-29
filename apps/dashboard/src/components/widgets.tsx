import * as React from "react";
import { Spending } from "./charts/spending";
import { Transactions } from "./charts/transactions";
import { AccountBalance } from "./widgets/account-balance";
import { Inbox } from "./widgets/inbox";
import { Insights } from "./widgets/insights";
import { Tracker } from "./widgets/tracker";

type Props = {
  disabled: boolean;
  initialPeriod: Date | string;
  searchParams: { [key: string]: string | string[] | undefined };
};

export const initialWidgetsVisibility = {
  insights: true,
  spending: true,
  tracker: true,
  inbox: false,
  transactions: false,
};

export function Widgets({ disabled, initialPeriod, searchParams }: Props) {
  const items = [
    <Insights key="insights" />,
    <Spending
      disabled={disabled}
      initialPeriod={initialPeriod}
      key="spending"
    />,
    <Tracker key="tracker" date={searchParams?.date} hideDaysIndicators />,
    <Transactions key="transactions" disabled={disabled} />,
    <Inbox key="inbox" disabled={disabled} />,
    <AccountBalance key="account-balance" />,
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
      {items.map((item, idx) => {
        return <div key={idx.toString()}>{item}</div>;
      })}
    </div>
  );
}
