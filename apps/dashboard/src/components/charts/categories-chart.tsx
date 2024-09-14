import { MonthlyFinancialByCategoryChart } from "@midday/ui/charts/financials/categories";
import { MonthlySpendingChart } from "@midday/ui/charts/financials/dashboard/financial-dashboard-overview";
import { cn } from "@midday/ui/cn";
import { HTMLAttributes } from "react";
import CardWrapper from "../card/card-wrapper";
import { Divider } from "../divider";

type ChartType = "categoryNetIncome" | "categoryIncome";

interface CategoryChartsProps extends HTMLAttributes<HTMLDivElement> {
    currency: string;
    disabledCharts?: ChartType[];
    disableAllCharts?: boolean;
}

export function CategoryCharts({ currency, disabledCharts = [], disableAllCharts = false }: CategoryChartsProps) {
    const chartOpacity = (chartName: ChartType) => disabledCharts.includes(chartName) ? "opacity-50" : "";

    return (
        <div className="flex h-full">
            {/* Left side: Income and Expense Categories */}
            <div className={cn("w-1/2 overflow-y-auto scrollbar-hide", disableAllCharts ? "opacity-50" : "")}>
                <div className="grid grid-cols-1 gap-4 mx-auto py-[2%]">
                    <CardWrapper
                        title="Expense Categories"
                        titleDescription="Year-to-date"
                        description="Overview of your company's profit performance"
                        subtitle="Expense Categories"
                        subtitleDescription="Compared to previous year"
                        className={`border-none ${chartOpacity("categoryNetIncome")}`}
                    >
                        <MonthlyFinancialByCategoryChart currency={currency} data={[]} height={400} type={"expense"} disabled={disableAllCharts || disabledCharts.includes("categoryNetIncome")}/>
                    </CardWrapper>
                    <Divider orientation="horizontal" />
                    <CardWrapper
                        title="Income Categories"
                        titleDescription="Year-to-date"
                        description="Overview of your company's profit performance"
                        subtitle="Revenue"
                        subtitleDescription="This month vs last month"
                        className={`border-none ${chartOpacity("categoryIncome")}`}
                    >
                        <MonthlyFinancialByCategoryChart currency={currency} data={[]} height={400} type={"income"} disabled={disableAllCharts || disabledCharts.includes("categoryIncome")}/>
                    </CardWrapper>
                </div>
            </div>
            
            {/* Vertical separator */}
            <Divider orientation="vertical" />
            
            {/* Right side: Monthly Spending Chart */}
            <div className="w-1/2 overflow-y-auto scrollbar-hide">
                <div className="p-4">
                    <MonthlySpendingChart transactions={[]} expenseMetrics={[]} incomeMetrics={[]} disabled={disableAllCharts}/>
                </div>
            </div>
        </div>
    )
}