import { getDailyExpenses, getTeams, getUser } from "@midday/supabase/cached-queries";
import { DataPoint, ZoomableChart } from "@midday/ui/charts/base/zoomable-chart";
import { ZoomableChartWithDrilldown } from "@midday/ui/charts/base/zoomable-chart-with-drilldown";
import { format, startOfMonth, subMonths } from 'date-fns';
import React, { Suspense } from 'react';

interface DailyExpensesChartProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    from?: string;
    to?: string;
    currency: string;
}

const DailyExpensesChartContent: React.FC<DailyExpensesChartProps> = async ({
    className,
    from,
    to,
    currency
}) => {

    // Default date range: from the start of last month to today
    const today = new Date();
    const defaultFrom = format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
    const defaultTo = format(today, 'yyyy-MM-dd');

    // Use provided dates or fall back to defaults
    const effectiveFrom = from || defaultFrom;
    const effectiveTo = to || defaultTo;

    // get the current team of the user
    const [user, expenses] = await Promise.all([
        getUser(),
        getDailyExpenses({
            from: effectiveFrom,
            to: effectiveTo,
            currency
        })
    ]);

    if (!user) {
        return null;
    }

    // zoomable chart should have all data points
    // transform the data to datapoints
    const data: Array<DataPoint> = expenses?.data?.map((expense) => ({
        date: expense.date,
        events: expense.total_expense
    })) || [];

    const hasData = data.length > 0;

    return (
        <ZoomableChartWithDrilldown
            data={hasData ? data : [{ date: effectiveFrom, events: 0 }, { date: effectiveTo, events: 0 }]}
            dataNameKey="expenses"
            height={500}
            footerDescription={hasData ? "Total expenses" : "No expense data available for the selected period"}
            chartType="area"
            description={hasData ? "Daily expenses" : "No expenses recorded"}
            title={`Daily Expenses (${format(new Date(effectiveFrom), 'MMM d, yyyy')} - ${format(new Date(effectiveTo), 'MMM d, yyyy')})`}
            className={!hasData ? "opacity-50" : className}
        />
    )
}

/**
 * DailyExpensesChart component displays a chart for daily expenses data.
 * It uses Suspense for loading state and handles cases with no data.
 * If no date range is provided, it defaults to showing data from the start of last month to today.
 */
const DailyExpensesChart: React.FC<DailyExpensesChartProps> = (props) => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <p>Loading expenses chart...</p>
            </div>
        }>
            <DailyExpensesChartContent {...props} />
        </Suspense>
    )
}

export { DailyExpensesChart };
