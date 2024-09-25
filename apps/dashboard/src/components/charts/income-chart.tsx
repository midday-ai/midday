import { getMetrics } from "@midday/supabase/cached-queries";
import { IncomeChartCard } from "./card/income-chart-card";
import { chartExampleData } from "./data";

type Props = {
    value: any;
    defaultValue: any;
    disabled?: boolean;
    currency?: string;
    type: string;
    
};

export async function IncomeChart({
    value,
    defaultValue,
    disabled,
    currency,
    type,
}: Props) {
    const data = disabled
        ? chartExampleData
        : await getMetrics({ ...defaultValue, ...value, type, currency });

    return (
        <IncomeChartCard
            disabled={disabled}
            currency={currency}
            data={data}
        />
    );
}
