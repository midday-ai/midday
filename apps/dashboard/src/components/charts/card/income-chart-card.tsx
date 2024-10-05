import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import React, { useMemo } from "react";
import { BarChart } from "../bar-chart";

type IncomeChartCardProps = {
  data: any;
  currency?: string;
  disabled?: boolean;
};

export const IncomeChartCard: React.FC<IncomeChartCardProps> = ({
  data,
  currency,
  disabled = false,
}) => {
  return (
    <div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">Income Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Average Monthly Income</p>
        <div className="h-[200px]">
          <BarChart data={data} />
        </div>
      </CardContent>
    </div>
  );
};
