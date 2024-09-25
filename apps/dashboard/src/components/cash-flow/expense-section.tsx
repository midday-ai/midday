import { ExpenseChartWrapper } from "@/components/chart-wrappers/expense-chart-wrapper";
import { ChartSelectors } from "@/components/charts/chart-selectors";
import { EmptyState } from "@/components/charts/empty-state";
import { UserTier } from "@midday/supabase/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { DrilldownMonthlyExpenseChartModal } from "../modals/charts/drilldown-monthly-expense-chart-modal";

type ExpenseSectionProps = {
  isEmpty: boolean;
  accounts: any;
  user: any;
  tier: UserTier;
  value: any;
  defaultValue: any;
};

export function ExpenseSection({
  isEmpty,
  accounts,
  user,
  tier,
  value,
  defaultValue,
}: ExpenseSectionProps) {
  return (
    <>
      {isEmpty && <EmptyState />}
      <div className={cn(isEmpty && "blur-[8px] opacity-20")}>
        {accounts?.data?.length && (
          <Card className="border-4 border-gray-100 p-[3%] shadow-md">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex justify-between">
                <CardTitle className="font-bold text-2xl md:text-4xl">
                  Expenses
                </CardTitle>
                <DrilldownMonthlyExpenseChartModal
                  value={value}
                  defaultValue={defaultValue}
                  disabled={isEmpty}
                  currency={accounts.data[0]?.currency ?? "USD"}
                />
              </div>
              <CardDescription className="max-w-xl">
                Effective expense management in an evolving business venture is
                crucial as it directly impacts profitability and financial
                stability. By carefully monitoring and adjusting expenses in
                response to market and operational changes, businesses can
                optimize resource allocation, ensuring long-term growth and
                competitive advantage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-[1%]">
              <ChartSelectors
                defaultValue={defaultValue}
                disableTypeSelector={true}
              />
              <ExpenseChartWrapper
                tier={tier}
                teamId={user?.data?.team_id ?? ""}
                currency={accounts.data[0]?.currency ?? "USD"}
                userId={user?.data?.id ?? ""}
                value={{
                  from: (value.from as string) ?? defaultValue.from,
                  to: (value.to as string) ?? defaultValue.to,
                  period: defaultValue.period,
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
