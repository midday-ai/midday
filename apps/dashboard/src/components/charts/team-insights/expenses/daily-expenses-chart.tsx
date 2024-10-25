import { getDailyExpenses } from "@midday/supabase/cached-queries";
import React from "react";
import {
  ChartWrapperProps,
  GenericChart,
} from "../wrapper/team-insight-chart-wrapper";

const DailyExpensesChart: React.FC<
  Omit<
    ChartWrapperProps,
    "dataFetcher" | "title" | "description" | "dataNameKey"
  >
> = (props) => (
  <GenericChart
    {...props}
    dataFetcher={getDailyExpenses}
    title="Daily Expenses"
    description="Daily expenses over time"
    dataNameKey="expenses"
    dataTransformer={(data: any) =>
      data?.map((item: any) => ({
        date: item.date,
        events: item.total_expense,
      }))
    }
  />
);

export { DailyExpensesChart };
