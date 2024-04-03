import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";
import * as React from "react";
import { Spending } from "./charts/spending";
import { Transactions } from "./charts/transactions";
import { Inbox } from "./widgets/inbox";
import { Insights } from "./widgets/insights";
import { Tracker } from "./widgets/tracker";
import { WidgetsVisibility } from "./widgets/widgets-visibility";

type Props = {
  disabled: boolean;
  initialPeriod: any;
  searchParams: any;
};

export const initialWidgetsVisibility = {
  insights: true,
  spending: true,
  tracker: true,
  inbox: false,
  transactions: false,
};

export async function Widgets({
  disabled,
  initialPeriod,
  searchParams,
}: Props) {
  const widgets = cookies().has(Cookies.Widgets)
    ? JSON.parse(cookies().get(Cookies.Widgets)?.value)
    : initialWidgetsVisibility;

  return (
    <div className="flex flex-col mt-14 space-y-4">
      <div className="ml-auto">
        <WidgetsVisibility widgets={widgets} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 2xl:gap-8 xl:grid-cols-3">
        {widgets.insights && <Insights />}
        {widgets.spending && (
          <Spending disabled={disabled} initialPeriod={initialPeriod} />
        )}
        {widgets.tracker && (
          <Tracker date={searchParams?.date} hideDaysIndicators />
        )}
        {widgets.transactions && <Transactions disabled={disabled} />}
        {widgets.inbox && <Inbox disabled={disabled} />}
      </div>
    </div>
  );
}
