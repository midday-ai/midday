import { getDailyExpenses, getExpenseAnomalies, getExpensesByMerchant, getMonthlyExpenses } from '@midday/supabase/cached-queries';
import React from 'react';
import { ChartWrapperProps, GenericChart } from "../wrapper/team-insight-chart-wrapper";

const MonthlyExpensesChart: React.FC<Omit<ChartWrapperProps, 'dataFetcher' | 'title' | 'description' | 'dataNameKey'>> = (props) => (
    <GenericChart
        {...props}
        dataFetcher={(params: { from: string; to: string; currency: string }) => {
            return getMonthlyExpenses({
                from: params.from,
                to: params.to,
                currency: params.currency,
            })
        }}
        title="Monthly Expenses"
        description="Monthly expenses over time"
        dataNameKey="expenses"
        dataTransformer={(data: Array<{
            month: string;
            total_expense: number;
        }>) => data?.map((item: any) => ({
            date: item.month,
            events: item.total_expense
        }))}
    />
);

export { MonthlyExpensesChart };

