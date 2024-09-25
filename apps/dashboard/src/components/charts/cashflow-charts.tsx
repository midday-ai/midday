import { Tier, isFreeТier } from "@/config/tier";
import { AreaChart } from "@midday/ui/charts/base/area-chart";
import { cn } from "@midday/ui/cn";
import { HTMLAttributes } from "react";
import CardWrapper from "../card/card-wrapper";
import { UpgradeTier } from "../upgrade-tier";

type ChartType = "netIncome" | "revenue" | "expenses" | "cashFlow";

interface CashflowChartsProps extends HTMLAttributes<HTMLDivElement> {
  currency: string;
  disabledCharts?: ChartType[];
  disableAllCharts?: boolean;
  tier: Tier;
}

export function CashflowCharts({
  currency,
  tier,
  disabledCharts = [],
  disableAllCharts = false,
}: CashflowChartsProps) {
  const chartOpacity = (chartName: ChartType) =>
    disabledCharts.includes(chartName) ? "opacity-50" : "";

  // based on the tier we disclose a different amount of information
  const isCurrentUserTierFree = isFreeТier(tier);

  return (
    <div className={cn("grid grid-cols-1 gap-4 mx-auto py-[2%]")}>
      <div className={cn(isCurrentUserTierFree && "relative")}>
        <CardWrapper
          title="Advanced Net Income Analytics"
          titleDescription="Year-to-date"
          description="Overview of your company's profit performance"
          subtitle="Net Income"
          subtitleDescription="Compared to previous year"
          className={`${chartOpacity("netIncome")}`}
        >
          {isCurrentUserTierFree && (
            <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />
          )}
          <AreaChart
            currency={currency}
            data={[]}
            height={500}
            disabled={disableAllCharts || disabledCharts.includes("netIncome")}
          />
        </CardWrapper>
      </div>
      <div className={cn(isCurrentUserTierFree && "relative")}>
        <CardWrapper
          title="Advanced Income Analytics"
          titleDescription="Monthly"
          description="Monthly revenue trends"
          subtitle="Revenue"
          subtitleDescription="This month vs last month"
          className={`${chartOpacity("revenue")}`}
        >
          {isCurrentUserTierFree && (
            <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />
          )}
          <AreaChart
            currency={currency}
            data={[]}
            height={500}
            disabled={disableAllCharts || disabledCharts.includes("revenue")}
          />
        </CardWrapper>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={cn(isCurrentUserTierFree && "relative")}>
          <CardWrapper
            title="Advanced Expenses Analytics"
            titleDescription="Monthly"
            description="Monthly expense breakdown"
            subtitle="Expenses"
            subtitleDescription="This month vs last month"
            className={`${chartOpacity("expenses")}`}
          >
            {isCurrentUserTierFree && (
              <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />
            )}
            <AreaChart
              currency={currency}
              data={[]}
              height={500}
              disabled={disableAllCharts || disabledCharts.includes("expenses")}
            />
          </CardWrapper>
        </div>
        <div className={cn(isCurrentUserTierFree && "relative")}>
          <CardWrapper
            title="Advanced Cash Flow Analytics"
            titleDescription="Quarterly"
            description="Quarterly cash flow overview"
            subtitle="Cash Flow"
            subtitleDescription="This quarter vs last quarter"
            className={`${chartOpacity("cashFlow")}`}
          >
            {isCurrentUserTierFree && (
              <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />
            )}
            <AreaChart
              currency={currency}
              data={[]}
              height={500}
              disabled={disableAllCharts || disabledCharts.includes("cashFlow")}
            />
          </CardWrapper>
        </div>
      </div>
    </div>
  );
}
