"use client";

import { ChartPeriod } from "@/components/charts/chart-period";
import { ChartType } from "@/components/charts/chart-type";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { ChartFilters } from "./chart-filters";

export function ChartSelectors() {
  const trpc = useTRPC();
  const { data: currencies } = useQuery(
    trpc.bankAccounts.currencies.queryOptions(),
  );

  return (
    <div className="flex justify-between mt-6 space-x-2">
      <div className="flex space-x-2">
        <ChartType />
      </div>

      <div className="flex space-x-2">
        <ChartPeriod />
        <ChartFilters
          currencies={
            currencies?.map((currency) => {
              return {
                id: currency.currency,
                name: currency.currency,
              };
            }) ?? []
          }
        />
      </div>
    </div>
  );
}
