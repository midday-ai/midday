import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { cn } from "../../../../utils/cn";
import { ExpenseMetrics, IncomeMetrics } from "client-typescript-sdk";
import { NetExpenseChart } from "../expenses/net-expense-chart";
import { NetIncomeChart } from "../net-income/net-income-chart";

export interface CashflowDashboardOverviewProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  title?: string;
  disabled?: boolean;
  incomeMetrics: IncomeMetrics[];
  expenseMetrics: ExpenseMetrics[];
}

export const CashflowDashboardOverview: React.FC<
  CashflowDashboardOverviewProps
> = ({
  className,
  title,
  disabled,
  incomeMetrics,
  expenseMetrics,
  ...rest
}) => {
  const rootClassName = cn(
    "grid gap-4 w-full",
    className,
    disabled && "opacity-50 pointer-events-none",
  );
  if (disabled) {
    expenseMetrics =
      FinancialDataGenerator.generateExpenseMetricsAcrossManyYears(2022, 2024);
    incomeMetrics = FinancialDataGenerator.generateIncomeMetricsAcrossManyYears(
      2022,
      2024,
    );
  }

  return (
    <div {...rest} className={rootClassName}>
      {title && <h2 className="text-xl sm:text-2xl font-bold mb-4">{title}</h2>}

      <div className="min-h-64 sm:min-h-96 rounded-lg p-4">
        {/* Add your chart component here */}
        <NetIncomeChart
          disabled={disabled}
          incomeMetrics={incomeMetrics}
          currency={"USD"}
          title={"Net Income"}
          price={1000}
          priceChange={20}
        />
      </div>

      {/* Expense and income */}
      <div className="grid gap-4">
        {expenseMetrics && expenseMetrics.length > 0 && (
          <div className="rounded-lg p-4 md:h-full">
            {/* Add your expenses component here */}
            <NetExpenseChart
              disabled={disabled}
              expenseMetrics={expenseMetrics}
              currency={"USD"}
              title={"Net Expense"}
              price={1000}
              priceChange={20}
            />
          </div>
        )}
      </div>
    </div>
  );
};
