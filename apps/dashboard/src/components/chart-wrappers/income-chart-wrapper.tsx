import { Tier } from "@/config/tier";
import { getExpenses } from "@midday/supabase/cached-queries";
import { startOfMonth, subMonths } from "date-fns";
import { ProfitRevenueChart } from "../charts/profit-revenue-chart";

type IncomeChartWrapperProps = {
    tier: Tier;
    teamId: string;
    currency: string;
    userId: string;
    value: {
        from: string;
        to: string;
        period: string;
    };
    type: "income" | "profit";
    enableGrowthRate?: boolean;
};

const defaultValue = {
    from: subMonths(startOfMonth(new Date()), 12).toISOString(),
    to: new Date().toISOString(),
    period: "monthly",
};

export async function IncomeChartWrapper({ tier, teamId, currency, userId, value, type, enableGrowthRate }: IncomeChartWrapperProps) {
    if (tier === "free") {
        return <ProfitRevenueChart value={value} defaultValue={defaultValue} type={type} enableGrowthRate={enableGrowthRate} />;
    }

    return null;
}