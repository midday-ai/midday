"use client";

import { getBackendClient } from "@/utils/backend";
import { formatCategoryName } from "@/utils/utils";
import { DataPoint, ZoomableChartWithDrilldown } from "@midday/ui/charts/base/zoomable-chart-with-drilldown";
import { NetIncomeChart } from "@midday/ui/charts/financials/net-income/net-income-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { GetIncomeMetricsProfileTypeEnum, GetIncomeMetricsRequest, IncomeMetrics } from "@solomon-ai/client-typescript-sdk";
import { format, parse, startOfMonth, subMonths } from 'date-fns';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

interface IncomeMetricsChartProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    from?: string;
    to?: string;
    pageNumber?: string;
    pageSize?: string;
    currency: string;
    userId: string;
}

const useIncomeMetrics = (userId: string, pageNumber: string, pageSize: string, selectedCategory: string) => {
    const [IncomeMetrics, setIncomeMetrics] = useState<IncomeMetrics[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchIncomeMetrics = async () => {
            setIsLoading(true);
            try {
                const c = getBackendClient();
                const request: GetIncomeMetricsRequest = {
                    userId,
                    pageNumber,
                    pageSize,
                    profileType: GetIncomeMetricsProfileTypeEnum.Business,
                    personalFinanceCategoryPrimary: selectedCategory !== 'All' ? selectedCategory : undefined
                };
                const response = await c.financialServiceApi.getIncomeMetrics(request);
                setIncomeMetrics(response.incomeMetrics || null);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('An error occurred'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchIncomeMetrics();
    }, [userId, pageNumber, pageSize, selectedCategory]);

    return { IncomeMetrics, isLoading, error };
};

const formatYearMonth = (yearMonth: string): string => {
    const date = parse(yearMonth, 'yyyyMM', new Date());
    return format(date, 'MMMM yyyy');
};

const IncomeMetricsChartContent: React.FC<IncomeMetricsChartProps> = ({
    className,
    from,
    to,
    currency,
    userId,
    pageNumber = "1",
    pageSize = "80"
}) => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { IncomeMetrics, isLoading, error } = useIncomeMetrics(userId, pageNumber, pageSize, selectedCategory);

    const today = useMemo(() => new Date(), []);
    const defaultFrom = useMemo(() => format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'), [today]);
    const defaultTo = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);
    const effectiveFrom = from || defaultFrom;
    const effectiveTo = to || defaultTo;

    const categories = useMemo(() => {
        if (!IncomeMetrics) return ['All'];
        return ['All', ...new Set(IncomeMetrics.map(metric => metric.personalFinanceCategoryPrimary).filter(Boolean))];
    }, [IncomeMetrics]);

    const transformExpenseData = useCallback((IncomeMetrics: IncomeMetrics[]): DataPoint[] => {
        return IncomeMetrics
            .map((expense) => ({
                date: formatYearMonth(expense.month?.toString() ?? ""),
                events: Number(Math.abs(expense.totalIncome ?? 0).toFixed(2)),
                originalMonth: expense.month // Keep the original month for sorting
            }))
            .sort((a, b) => (a.originalMonth ?? 0) - (b.originalMonth ?? 0)) // Sort by original month
            .map(({ date, events }) => ({ date, events })); // Remove the originalMonth property
    }, []);

    const data = useMemo(() => {
        if (!IncomeMetrics) return [];
        return transformExpenseData(IncomeMetrics);
    }, [IncomeMetrics, transformExpenseData]);

    const hasData = data.length > 0;

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!IncomeMetrics) return null;

    const incomeMetricsData: Array<IncomeMetrics> = IncomeMetrics.map((metric) => ({
        ...metric,
        totalIncome: Number(Math.abs(metric.totalIncome ?? 0).toFixed(2)),
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
                dataNameKey="income"
                height={600}
                footerDescription={hasData ? `Total income (${formatCategoryName(selectedCategory)})` : "No expense data available for the selected period"}
                chartType="area"
                description={hasData ? `Monthly income (${formatCategoryName(selectedCategory)})` : "No income recorded"}
                title={`Monthly income (${format(new Date(effectiveFrom), 'MMM d, yyyy')} - ${format(new Date(effectiveTo), 'MMM d, yyyy')})`}
                className={!hasData ? "opacity-50" : className}
            />
            <NetIncomeChart title={"Net Income Metrics"} price={incomeMetricsData[incomeMetricsData.length - 1]?.totalIncome ?? 0} priceChange={0} incomeMetrics={incomeMetricsData ?? []} currency={"USD"} />

        </div>
    );
};

const IncomeMetricsChart: React.FC<IncomeMetricsChartProps> = (props) => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <p>Loading income chart...</p>
            </div>
        }>
            <IncomeMetricsChartContent {...props} />
        </Suspense>
    );
};

export { IncomeMetricsChart };
