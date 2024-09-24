import { getExpenseGrowthRate } from "@midday/supabase/cached-queries";
import { BarChartMulti } from "@midday/ui/charts/base/bar-chart-multi";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@midday/ui/tooltip";
import Link from "next/link";
import { ExpenseGrowthRateBarChart } from "./expense-growth-rate-bar-chart";

type Props = {
    value: any;
    defaultValue: any;
    disabled?: boolean;
    currency?: string;
};

export async function ExpenseGrowthRateChart({
    value,
    defaultValue,
    disabled,
    currency,
}: Props) {
    const result = await getExpenseGrowthRate({ ...defaultValue, ...value, currency });

    if (!result) {
        return null;
    }

    // get the largest growth rate
    const mostPositiveGrowthRate = result?.data?.reduce((max: any, item: any) => (item.growth_rate > max.growth_rate ? item : max), result?.data[0]);
    const mostNegativeGrowthRate = result?.data?.reduce((min: any, item: any) => (item.growth_rate < min.growth_rate ? item : min), result?.data[0]);
    // get the absolute value of the largest growth rate
    const largestGrowthRate = Math.max(Math.abs(mostPositiveGrowthRate.growth_rate), Math.abs(mostNegativeGrowthRate.growth_rate));
    // figure out the sign of the largest growth rate
    const largestGrowthRateSign = mostPositiveGrowthRate.growth_rate > Math.abs(mostNegativeGrowthRate.growth_rate) ? "+" : "-";

    // compute average expense
    const averageExpense = result?.data?.reduce((sum: any, item: any) => sum + item.total_expense, 0) / (result?.data?.length || 1);
    const summary = {
        averageExpense: averageExpense,
        currency: currency,
    };

    const growthRateBarChartData = result?.data?.map((item: any) => ({
        date: item.period ?? "",
        expense: item.total_expense ?? 0,
        growth_rate: item.growth_rate ?? 0,
    })) || [];

    const meta = {
        currency: currency,
    };

    const growthRateBarChartProps = {
        data: growthRateBarChartData,
        meta: meta,
    };

    return (
        <div className={cn(disabled && "pointer-events-none select-none")}>
            <div className="space-y-2 mb-14 inline-block select-text">
                <h1 className="text-4xl font-mono">
                    {largestGrowthRateSign} {largestGrowthRate.toFixed(2)}%
                </h1>
            
                <div className="text-sm text-[#606060] flex items-center space-x-2">
                    <p className="text-sm">
                        {mostPositiveGrowthRate.growth_rate > Math.abs(mostNegativeGrowthRate.growth_rate) ? "Expenses increased" : "Expenses decreased"} by {largestGrowthRate.toFixed(2)}% compared to the previous period.
                    </p>
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Icons.Info className="h-4 w-4 mt-1" />
                            </TooltipTrigger>
                            <TooltipContent
                                className="text-xs text-[#878787] max-w-[240px] p-4"
                                side="bottom"
                                sideOffset={10}
                            >
                                <div className="space-y-2">
                                    <h3 className="font-medium text-primary">
                                        Expenses Overview
                                    </h3>
                                    <p>
                                        Expenses include all outgoing transactions, including
                                        recurring ones. The chart shows total expenses and recurring
                                        costs, helping you identify spending patterns and fixed
                                        costs.
                                    </p>
                                    <p>
                                        All amounts are converted into your{" "}
                                        <Link
                                            href="/settings/accounts"
                                            className="text-primary underline"
                                        >
                                            base currency
                                        </Link>
                                        .
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            {/* <BarChartMulti data={areaChartData} currency={currency ?? "USD"} height={400} chartType="group" /> */}
            <ExpenseGrowthRateBarChart data={{
                result: growthRateBarChartProps.data.map(item => ({
                    date: item.date,
                    expense: item.expense,
                    growthRate: item.growth_rate
                })),
                meta: {
                    currency: growthRateBarChartProps.meta.currency || 'USD'
                }
            }} height={400} />
        </div>
    );
}
