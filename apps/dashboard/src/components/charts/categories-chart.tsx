import { MonthlyFinancialByCategoryChart } from "@midday/ui/charts/financials/categories";
import { MonthlySpendingChart } from "@midday/ui/charts/financials/dashboard/financial-dashboard-overview";
import { cn } from "@midday/ui/cn";
import { HTMLAttributes } from "react";
import CardWrapper from "../card/card-wrapper";
import { Divider } from "../divider";
import { EmptyState } from "./empty-state";

type ChartType = "categoryNetIncome" | "categoryIncome";

interface CategoryChartsProps extends HTMLAttributes<HTMLDivElement> {
    currency: string;
    disabledCharts?: ChartType[];
    disableAllCharts?: boolean;
}

export function CategoryCharts({
    currency,
    disabledCharts = [],
    disableAllCharts = false,
}: CategoryChartsProps) {
    const chartOpacity = (chartName: ChartType) =>
        disabledCharts.includes(chartName) ? "opacity-50" : "";

    return (
        <div className={cn("flex h-full")}>
            {/* Left side: Income and Expense Categories */}
            <div
                className={cn(
                    "w-1/2 overflow-y-auto scrollbar-hide",
                    disableAllCharts && "mt-8 relative"
                )}
            >
                {disableAllCharts && <EmptyState />}
                <div className={cn("grid grid-cols-1 gap-4 mx-auto py-[2%]", disableAllCharts && "blur-[8px] opacity-20")}>
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
                                disableAllCharts || disabledCharts.includes("categoryNetIncome")
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
                                disableAllCharts || disabledCharts.includes("categoryIncome")
                            }
                        />
                    </CardWrapper>
                </div>
            </div>

            {/* Vertical separator */}
            <Divider orientation="vertical" />

            {/* Right side: Monthly Spending Chart */}
            <div className={cn("w-1/2 overflow-y-auto scrollbar-hide", disableAllCharts && "mt-8 relative")}>
                {disableAllCharts && <EmptyState />}
                <div className={cn("p-4", disableAllCharts && "blur-[8px] opacity-20")}>
                    <MonthlySpendingChart
                        transactions={[]}
                        expenseMetrics={[]}
                        incomeMetrics={[]}
                        disabled={disableAllCharts}
                    />
                </div>
            </div>
        </div>
    );
}
