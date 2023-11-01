"use client";

import { BarChart } from "@tremor/react";

export function ProfitLossChart() {
  return (
    <BarChart
      categories={["Sales", "Successful Payments"]}
      className="h-[400px]"
      data={[
        {
          Sales: 4000,
          "Successful Payments": 3000,
          month: "Jan 21",
        },
        {
          Sales: 3000,
          "Successful Payments": 2000,
          month: "Feb 21",
        },
        {
          Sales: 2000,
          "Successful Payments": 1700,
          month: "Mar 21",
        },
        {
          Sales: 2780,
          "Successful Payments": -2500,
          month: "Apr 21",
        },
        {
          Sales: 1890,
          "Successful Payments": -1890,
          month: "May 21",
        },
        {
          Sales: 2390,
          "Successful Payments": -2000,
          month: "Jun 21",
        },
        {
          Sales: 100,
          "Successful Payments": -3000,
          month: "Jul 21",
        },
      ]}
      index="month"
      onValueChange={function noRefCheck() {}}
    />
  );
}
