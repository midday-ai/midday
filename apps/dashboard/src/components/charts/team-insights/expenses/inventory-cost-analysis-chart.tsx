import { getInventoryCostAnalysis } from "@midday/supabase/cached-queries";
import React from "react";
import {
  ChartWrapperProps,
  GenericChart,
} from "../wrapper/team-insight-chart-wrapper";

/**
 * The `InventoryCostAnalysisChart` component is a visual representation of inventory costs
 * over a specified period, helping teams to understand expense trends related to inventory.
 * It retrieves data from the backend using `getInventoryCostAnalysis` and transforms it into
 * a format suitable for display in the chart.
 *
 * This chart allows businesses to make informed decisions by providing insights into the total
 * expenses associated with managing inventory, displayed on a monthly basis.
 * The component integrates seamlessly with the broader `team-insight-chart-wrapper`, ensuring
 * consistent behavior across different types of charts.
 *
 * Features:
 * - Data fetching based on a specified time range and currency.
 * - Automatic transformation of the data for use in the chart, with key fields being the month
 *   and total inventory expenses.
 * - Flexible use in various contexts by omitting unnecessary props and relying on defaults
 *   provided by the wrapper.
 *
 * Props:
 * - Inherits all properties from `ChartWrapperProps`, except for `dataFetcher`, `title`, `description`,
 *   and `dataNameKey`, which are managed internally by this component.
 *
 * @component
 */
const InventoryCostAnalysisChart: React.FC<
  Omit<
    ChartWrapperProps,
    "dataFetcher" | "title" | "description" | "dataNameKey"
  >
> = (props) => (
  <GenericChart
    {...props}
    dataFetcher={(params: { from: string; to: string; currency: string }) => {
      return getInventoryCostAnalysis({
        from: params.from,
        to: params.to,
        currency: params.currency,
      });
    }}
    title="Monthly Inventory Expense Trends"
    description="This chart provides a detailed analysis of inventory expenses over time. By tracking costs month by month, businesses can gain valuable insights into how much they are spending on inventory and how those expenses evolve over the specified time frame. The data is aggregated and displayed in the selected currency, offering an easily digestible view of key financial metrics."
    dataNameKey="expenses"
    dataTransformer={(
      data: Array<{
        month: string;
        total_expense: number;
      }>,
    ) =>
      data?.map((item: any) => ({
        date: item.month,
        events: item.total_expense,
      }))
    }
  />
);

export { InventoryCostAnalysisChart };
