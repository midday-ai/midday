import { Tier } from "@/config/tier";
import { startOfMonth, subMonths } from "date-fns";
import { ExpenseGrowthRateChart } from "../charts/expense-growth-rate-chart";
import { InventoryCostChart } from "../charts/inventory-cost-chart";

type ExpenseGrowthRateChartWrapperProps = {
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

export async function ExpenseGrowthRateChartWrapper({
  tier,
  teamId,
  currency,
  userId,
  value,
}: ExpenseGrowthRateChartWrapperProps) {
  if (tier === "free") {
    return <ExpenseGrowthRateChart value={value} defaultValue={defaultValue} />;
  }

  return null;
}
