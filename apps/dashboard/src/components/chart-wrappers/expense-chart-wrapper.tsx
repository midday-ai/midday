import { ExpenseChart } from "@/components/charts/expense-chart";
import { Tier } from "@/config/tier";
import { getExpenses } from "@midday/supabase/cached-queries";
import { startOfMonth, subMonths } from "date-fns";

type ExpenseChartWrapperProps = {
  tier: Tier;
  teamId: string;
  currency: string;
  userId: string;
  value: {
    from: string;
    to: string;
    period: string;
  };
};

const defaultValue = {
  from: subMonths(startOfMonth(new Date()), 12).toISOString(),
  to: new Date().toISOString(),
  period: "monthly",
};

export async function ExpenseChartWrapper({ tier, teamId, currency, userId, value }: ExpenseChartWrapperProps) {
  if (tier === "free") {
    return <ExpenseChart value={value} defaultValue={defaultValue} />;
  }

  return null;
}