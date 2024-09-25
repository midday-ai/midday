import { ExpenseChartWrapper } from "@/components/chart-wrappers/expense-chart-wrapper";
import { ChartSelectors } from "@/components/charts/chart-selectors";
import { EmptyState } from "@/components/charts/empty-state";
import Tier from "@/config/tier";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { InventoryCostChartWrapper } from "../chart-wrappers/inventory-cost-chart-wrapper";
import { DrilldownMonthlyExpenseChartModal } from "../modals/charts/drilldown-monthly-expense-chart-modal";

type InventoryCostSectionProps = {
  isEmpty: boolean;
  accounts: any;
  user: any;
  tier: Tier;
  value: any;
  defaultValue: any;
};

export function InventoryCostSection({
  isEmpty,
  accounts,
  user,
  tier,
  value,
  defaultValue,
}: InventoryCostSectionProps) {
  return (
    <>
      {isEmpty && <EmptyState />}
      <div className={cn(isEmpty && "blur-[8px] opacity-20")}>
        {accounts?.data?.length && (
          <Card className="border-4 border-gray-100 p-[3%] shadow-md">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex justify-between">
                <CardTitle className="font-bold text-2xl md:text-4xl">
                  Inventory Cost
                </CardTitle>
                <DrilldownMonthlyExpenseChartModal
                  value={value}
                  defaultValue={defaultValue}
                  disabled={isEmpty}
                  currency={accounts.data[0]?.currency ?? "USD"}
                />
              </div>
              <CardDescription className="max-w-xl">
                Efficient inventory cost management is vital for maintaining
                healthy cash flow and maximizing profitability. By tracking
                stock levels, optimizing ordering processes, and minimizing
                holding costs, businesses can free up working capital, reduce
                waste, and improve overall financial performance. This strategic
                approach to inventory ensures better cash flow forecasting and
                operational flexibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-[1%]">
              <ChartSelectors
                defaultValue={defaultValue}
                disableTypeSelector={true}
              />
              <InventoryCostChartWrapper
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
