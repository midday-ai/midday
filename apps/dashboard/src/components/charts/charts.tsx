"use client";

import { useMetricsParams } from "@/hooks/use-metrics-params";
import { BurnRateChart } from "./burn-rate-chart";
import { ExpenseChart } from "./expense-chart";
import { ProfitChart } from "./profit-chart";
import { RevenueChart } from "./revenue-chart";

type Props = {
  disabled: boolean;
};

export function Charts({ disabled }: Props) {
  const { params } = useMetricsParams();

  switch (params.chart) {
    case "revenue":
      return <RevenueChart disabled={disabled} />;
    case "profit":
      return <ProfitChart disabled={disabled} />;
    case "burn_rate":
      return <BurnRateChart disabled={disabled} />;
    case "expense":
      return <ExpenseChart disabled={disabled} />;
    default:
      return null;
  }
}
