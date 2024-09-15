import { AreaChart } from "@midday/ui/charts/base/area-chart";
import { cn } from "@midday/ui/cn";
import { HTMLAttributes } from "react";
import CardWrapper from "../card/card-wrapper";

type ChartType = "netIncome" | "revenue" | "expenses" | "cashFlow";

interface CashflowChartsProps extends HTMLAttributes<HTMLDivElement> {
  currency: string;
  disabledCharts?: ChartType[];
  disableAllCharts?: boolean;
}

export function CashflowCharts({
  currency,
  disabledCharts = [],
  disableAllCharts = false,
}: CashflowChartsProps) {
  const chartOpacity = (chartName: ChartType) =>
    disabledCharts.includes(chartName) ? "opacity-50" : "";

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 mx-auto py-[2%]",
        disableAllCharts ? "opacity-50" : "",
      )}
    >
      <CardWrapper
        title="Net Income"
        titleDescription="Year-to-date"
        description="Overview of your company's profit performance"
        subtitle="Net Income"
        subtitleDescription="Compared to previous year"
        className={`${chartOpacity("netIncome")}`}
      >
        <AreaChart
          currency={currency}
          data={[]}
          height={500}
          disabled={disableAllCharts || disabledCharts.includes("netIncome")}
        />
      </CardWrapper>
      <CardWrapper
        title="Income"
        titleDescription="Monthly"
        description="Monthly revenue trends"
        subtitle="Revenue"
        subtitleDescription="This month vs last month"
        className={`${chartOpacity("revenue")}`}
      >
        <AreaChart
          currency={currency}
          data={[]}
          height={500}
          disabled={disableAllCharts || disabledCharts.includes("revenue")}
        />
      </CardWrapper>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardWrapper
          title="Expenses"
          titleDescription="Monthly"
          description="Monthly expense breakdown"
          subtitle="Expenses"
          subtitleDescription="This month vs last month"
          className={`${chartOpacity("expenses")}`}
        >
          <AreaChart
            currency={currency}
            data={[]}
            height={500}
            disabled={disableAllCharts || disabledCharts.includes("expenses")}
          />
        </CardWrapper>
        <CardWrapper
          title="Cash Flow"
          titleDescription="Quarterly"
          description="Quarterly cash flow overview"
          subtitle="Cash Flow"
          subtitleDescription="This quarter vs last quarter"
          className={`${chartOpacity("cashFlow")}`}
        >
          <AreaChart
            currency={currency}
            data={[]}
            height={500}
            disabled={disableAllCharts || disabledCharts.includes("cashFlow")}
          />
        </CardWrapper>
      </div>
    </div>
  );
}
