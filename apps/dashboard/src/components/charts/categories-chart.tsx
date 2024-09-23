import Tier from "@/config/tier";
import { MonthlyFinancialByCategoryChart } from "@midday/ui/charts/financials/categories";
import { MonthlySpendingChart } from "@midday/ui/charts/financials/dashboard/financial-dashboard-overview";
import { cn } from "@midday/ui/cn";
import { HTMLAttributes } from "react";
import CardWrapper from "../card/card-wrapper";
import { Divider } from "../divider";
import { UpgradeTier } from "../upgrade-tier";
import { EmptyState } from "./empty-state";

type ChartType = "categoryNetIncome" | "categoryIncome";

interface CategoryChartsProps extends HTMLAttributes<HTMLDivElement> {
  currency: string;
  tier: Tier;
  disabledCharts?: ChartType[];
  disableAllCharts?: boolean;
}

export function CategoryCharts({
  currency,
  tier,
  disabledCharts = [],
  disableAllCharts = false,
}: CategoryChartsProps) {
  const chartOpacity = (chartName: ChartType) =>
    disabledCharts.includes(chartName) ? "opacity-50" : "";

  const isFreeTier = tier === "free";

  const disableAll = isFreeTier || disableAllCharts;

  return (
    <div className={cn("flex h-full")}>
      {/* Left side: Income and Expense Categories */}
      <div
        className={cn(
          "w-1/2 overflow-y-auto scrollbar-hide",
          disableAll && "mt-8 relative",
        )}
      >
        {disableAllCharts && <EmptyState />}
        {isFreeTier && <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />}

        <div
          className={cn(
            "grid grid-cols-1 gap-4 mx-auto py-[2%]",
            disableAll && "blur-[8px] opacity-20",
          )}
        >
          <CardWrapper
            title="Expense Categories"
            titleDescription="Year-to-date"
            description="Overview of your company's profit performance"
            subtitle="Expense Categories"
            subtitleDescription="Compared to previous year"
            className={`${chartOpacity("categoryNetIncome")}`}
          >
            <MonthlyFinancialByCategoryChart
              currency={currency}
              data={[]}
              height={400}
              type={"expense"}
              disabled={
                disableAll || disabledCharts.includes("categoryNetIncome")
              }
            />
          </CardWrapper>
          <Divider orientation="horizontal" />
          <CardWrapper
            title="Income Categories"
            titleDescription="Year-to-date"
            description="Overview of your company's profit performance"
            subtitle="Revenue"
            subtitleDescription="This month vs last month"
            className={`${chartOpacity("categoryIncome")}`}
          >
            <MonthlyFinancialByCategoryChart
              currency={currency}
              data={[]}
              height={400}
              type={"income"}
              disabled={
                disableAll || disabledCharts.includes("categoryIncome")
              }
            />
          </CardWrapper>
        </div>
      </div>

      {/* Vertical separator */}
      <Divider orientation="vertical" />

      {/* Right side: Monthly Spending Chart */}
      <div
        className={cn(
          "w-1/2 overflow-y-auto scrollbar-hide",
          disableAll && "mt-8 relative",
        )}
      >
        {disableAllCharts && <EmptyState />}
        {isFreeTier && <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />}

        <div className={cn("p-4", disableAll && "blur-[8px] opacity-20")}>
          <MonthlySpendingChart
            transactions={[]}
            expenseMetrics={[]}
            incomeMetrics={[]}
            disabled={disableAll}
          />
        </div>
      </div>
    </div>
  );
}
