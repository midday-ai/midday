"use client";

import { useMetricsParams } from "@/hooks/use-metrics-params";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { BurnRateChart } from "./burn-rate-chart";
import { ExpenseChart } from "./expense-chart";
import { ProfitChart } from "./profit-chart";
import { RevenueChart } from "./revenue-chart";

export function Charts() {
  const { params } = useMetricsParams();
  const trpc = useTRPC();

  const { data: accounts } = useQuery(
    trpc.bankAccounts.get.queryOptions({
      enabled: true,
    }),
  );

  // If the user has not connected any accounts, disable the charts
  const disabled = !accounts?.length;

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
