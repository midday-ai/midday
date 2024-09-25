import { Tier } from "@/config/tier";
import { startOfMonth, subMonths } from "date-fns";
import { InventoryCostChart } from "../charts/inventory-cost-chart";

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

export async function InventoryCostChartWrapper({
  tier,
  teamId,
  currency,
  userId,
  value,
}: ExpenseChartWrapperProps) {
  if (tier === "free") {
    return <InventoryCostChart value={value} defaultValue={defaultValue} />;
  }

  return null;
}
