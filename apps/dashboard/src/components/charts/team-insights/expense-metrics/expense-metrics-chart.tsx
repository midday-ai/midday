"use client";

import { getBackendClient } from "@/utils/backend";
import { formatCategoryName } from "@/utils/utils";
import { DataPoint, ZoomableChartWithDrilldown } from "@midday/ui/charts/base/zoomable-chart-with-drilldown";
import { NetExpenseChart } from "@midday/ui/charts/financials/expenses/net-expense-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { ExpenseMetrics, GetExpenseMetricsProfileTypeEnum, GetExpenseMetricsRequest } from "@solomon-ai/client-typescript-sdk";
import { format, parse, startOfMonth, subMonths } from 'date-fns';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

interface ExpenseMetricsChartProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    from?: string;
    to?: string;
    pageNumber?: string;
    pageSize?: string;
    currency: string;
    userId: string;
}

const useExpenseMetrics = (userId: string, pageNumber: string, pageSize: string, selectedCategory: string) => {
    const [expenseMetrics, setExpenseMetrics] = useState<ExpenseMetrics[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchExpenseMetrics = async () => {
            setIsLoading(true);
            try {
                const c = getBackendClient();
                const request: GetExpenseMetricsRequest = {
                    userId,
                    pageNumber,
                    pageSize,
                    profileType: GetExpenseMetricsProfileTypeEnum.Business,
                    personalFinanceCategoryPrimary: selectedCategory !== 'All' ? selectedCategory : undefined
                };
                const response = await c.financialServiceApi.getExpenseMetrics(request);
                setExpenseMetrics(response.expenseMetrics || null);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('An error occurred'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchExpenseMetrics();
    }, [userId, pageNumber, pageSize, selectedCategory]);

    return { expenseMetrics, isLoading, error };
};

const formatYearMonth = (yearMonth: string): string => {
    const date = parse(yearMonth, 'yyyyMM', new Date());
    return format(date, 'MMMM yyyy');
};

const ExpenseMetricsChartContent: React.FC<ExpenseMetricsChartProps> = ({
    className,
    from,
    to,
    currency,
    userId,
    pageNumber = "1",
    pageSize = "80"
}) => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { expenseMetrics, isLoading, error } = useExpenseMetrics(userId, pageNumber, pageSize, selectedCategory);

    const today = useMemo(() => new Date(), []);
    const defaultFrom = useMemo(() => format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'), [today]);
    const defaultTo = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);
    const effectiveFrom = from || defaultFrom;
    const effectiveTo = to || defaultTo;

    const categories = useMemo(() => {
        if (!expenseMetrics) return ['All'];
        return ['All', ...new Set(expenseMetrics.map(metric => metric.personalFinanceCategoryPrimary).filter(Boolean))];
    }, [expenseMetrics]);

    const transformExpenseData = useCallback((expenseMetrics: ExpenseMetrics[]): DataPoint[] => {
        return expenseMetrics
            .map((expense) => ({
                date: formatYearMonth(expense.month?.toString() ?? ""),
                events: Number(Math.abs(expense.totalExpenses ?? 0).toFixed(2)),
                originalMonth: expense.month // Keep the original month for sorting
            }))
            .sort((a, b) => (a.originalMonth ?? 0) - (b.originalMonth ?? 0)) // Sort by original month
            .map(({ date, events }) => ({ date, events })); // Remove the originalMonth property
    }, []);

    const data = useMemo(() => {
        if (!expenseMetrics) return [];
        return transformExpenseData(expenseMetrics);
    }, [expenseMetrics, transformExpenseData]);

    const hasData = data.length > 0;

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!expenseMetrics) return null;

    // format expense metrics value
    const expenseMetricsData: Array<ExpenseMetrics> = expenseMetrics.map((metric) => ({
        ...metric,
        totalExpenses: Number(Math.abs(metric.totalExpenses ?? 0).toFixed(2)),
    }));

    return (
        <div className="flex flex-col gap-2">
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                <SelectTrigger className="w-[180px] mb-4 rounded-2xl">
                    <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category} value={category as string}>
                            {formatCategoryName(category as string)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex flex-col gap-4 text-4xl py-[5%] font-bold justify-start items-start w-[50%]">
                Your expenses for the period from {effectiveFrom} to {effectiveTo} across the {formatCategoryName(selectedCategory as string).toLocaleLowerCase()} category
            </div>

            <ZoomableChartWithDrilldown
                data={hasData ? data : [{ date: effectiveFrom, events: 0 }, { date: effectiveTo, events: 0 }]}
                dataNameKey="expenses"
                height={600}
                footerDescription={hasData ? `Total expenses (${formatCategoryName(selectedCategory)})` : "No expense data available for the selected period"}
                chartType="area"
                description={hasData ? `Monthly expenses (${formatCategoryName(selectedCategory)})` : "No expenses recorded"}
                title={`Monthly Expenses (${format(new Date(effectiveFrom), 'MMM d, yyyy')} - ${format(new Date(effectiveTo), 'MMM d, yyyy')})`}
                className={!hasData ? "opacity-50" : className}
            />
            <NetExpenseChart title={"Net Expense Metrics"} price={expenseMetricsData[expenseMetricsData.length - 1]?.totalExpenses ?? 0} priceChange={0} expenseMetrics={expenseMetricsData ?? []} currency={"USD"} />
        </div>
    );
};

const ExpenseMetricsChart: React.FC<ExpenseMetricsChartProps> = (props) => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <p>Loading expenses chart...</p>
            </div>
        }>
            <ExpenseMetricsChartContent {...props} />
        </Suspense>
    );
};

export { ExpenseMetricsChart };
