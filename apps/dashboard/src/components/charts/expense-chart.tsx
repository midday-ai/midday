import { getExpenses } from "@midday/supabase/cached-queries";
import { ExpenseChartCard } from "./card/expense-chart-card";
import { expenseChartExampleData } from "./data";

type Props = {
  value: any;
  defaultValue: any;
  disabled?: boolean;
  currency?: string;
};

export async function ExpenseChart({
  value,
  defaultValue,
  disabled,
  currency,
}: Props) {
  const data = disabled
    ? expenseChartExampleData
    : await getExpenses({ ...defaultValue, ...value, currency });

  return (
    <ExpenseChartCard
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      currency={currency}
      data={data}
    />
  );
}
