import { getUser } from "@midday/supabase/cached-queries";
import { DataPoint } from "@midday/ui/charts/base/zoomable-chart";
import { ZoomableChartWithDrilldown } from "@midday/ui/charts/base/zoomable-chart-with-drilldown";
import { format, startOfMonth, subMonths } from 'date-fns';
import React, { Suspense } from 'react';

export interface ChartWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    from?: string;
    to?: string;
    currency: string;
    dataFetcher: (params: { from: string; to: string; currency: string }) => Promise<any>;
    title: string;
    description: string;
    dataNameKey: string;
    dataTransformer?: (rawData: any) => DataPoint[];
    height?: number;
}

const ChartContentWrapper: React.FC<ChartWrapperProps> = async ({
    className,
    from,
    to,
    currency,
    dataFetcher,
    title,
    description,
    dataNameKey,
    dataTransformer,
    height = 500,
}) => {
    // Default date range: from the start of last month to today
    const today = new Date();
    const defaultFrom = format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
    const defaultTo = format(today, 'yyyy-MM-dd');

    // Use provided dates or fall back to defaults
    const effectiveFrom = from || defaultFrom;
    const effectiveTo = to || defaultTo;

    // get the current user and fetch data
    const [user, rawData] = await Promise.all([
        getUser(),
        dataFetcher({ from: effectiveFrom, to: effectiveTo, currency })
    ]);

    if (!user) {
        return null;
    }

    // Transform the data to datapoints
    const defaultTransformer = (data: any) => data?.map((item: any) => ({
        date: item.date,
        events: item.total || item.amount || item.value
    }));

    const data: Array<DataPoint> = (dataTransformer || defaultTransformer)(rawData?.data) || [];

    const hasData = data.length > 0;

    return (
        <ZoomableChartWithDrilldown
            data={hasData ? data : [{ date: effectiveFrom, events: 0 }, { date: effectiveTo, events: 0 }]}
            dataNameKey={dataNameKey}
            height={height}
            footerDescription={hasData ? `Total ${dataNameKey}` : `No ${dataNameKey} data available for the selected period`}
            chartType="area"
            description={hasData ? description : `No ${dataNameKey} recorded`}
            title={`${title} (${format(new Date(effectiveFrom), 'MMM d, yyyy')} - ${format(new Date(effectiveTo), 'MMM d, yyyy')})`}
            className={!hasData ? "opacity-50" : className}
        />
    );
}

/**
 * GenericChart component that can be used to create various charts with different data sources.
 * It uses Suspense for loading state and handles cases with no data.
 * If no date range is provided, it defaults to showing data from the start of last month to today.
 */
const GenericChart: React.FC<ChartWrapperProps> = (props) => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <p>Loading chart...</p>
            </div>
        }>
            <ChartContentWrapper {...props} />
        </Suspense>
    );
}

export { GenericChart };
