import {
  getDailyExpenses,
  getExpenseForecast,
} from "@midday/supabase/cached-queries";
import React from "react";
import {
  ChartWrapperProps,
  GenericChart,
} from "../wrapper/team-insight-chart-wrapper";

/**
 * The `ExpenseForecastChart` component visualizes both historical and forecasted daily expenses,
 * enabling teams to better understand their expense patterns and plan for future spending.
 * By fetching expense forecast data over a specified period and transforming it into a
 * digestible format, this chart provides a clear view of how expenses evolve day by day.
 *
 * The forecast is calculated based on a rolling lookback of three months, allowing businesses
 * to see expected trends and gain insights into potential future costs. With this information,
 * decision-makers can adjust their strategies to optimize spending and resource allocation.
 *
 * Features:
 * - Fetches daily expense forecasts using specified parameters such as date range and currency.
 * - Displays forecasted expenses based on the last three months of data.
 * - Seamless integration with the broader charting system, leveraging `GenericChart` for
 *   consistency and flexibility.
 *
 * Props:
 * - Inherits most properties from `ChartWrapperProps`, except for `dataFetcher`, `title`,
 *   `description`, and `dataNameKey`, which are set internally.
 *
 * @component
 */
const ExpenseForecastChart: React.FC<
  Omit<
    ChartWrapperProps,
    "dataFetcher" | "title" | "description" | "dataNameKey"
  >
> = (props) => (
  <GenericChart
    {...props}
    dataFetcher={(params: { from: string; to: string; currency: string }) => {
      return getExpenseForecast({
        forecastDate: params.to,
        currency: params.currency,
        lookbackMonths: 5,
      });
    }}
    title="Daily Expense Forecast and Historical Trends"
    description="This chart provides an analysis of daily expenses, including forecasted expenses over a selected period based on historical data. Using a 3-month lookback window, it offers insights into past daily expenditures as well as predictions for future spending, allowing businesses to optimize budget planning and financial decision-making."
    dataNameKey="forecasts"
    dataTransformer={(
      data: Array<{
        forecasted_date: string;
        forecasted_expense: number;
      }>,
    ) =>
      data?.map((item: any) => ({
        date: item.forecasted_date,
        events: item.forecasted_expense,
      }))
    }
  />
);

export { ExpenseForecastChart };
