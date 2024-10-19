import { ExpenseMetrics } from "client-typescript-sdk";
import { ArrowRightIcon } from "lucide-react";
import { useMemo } from "react";
import { FinancialExpenseAndIncomeMetricsConverter } from "../../../../lib/converters/expense-and-income-metrics-converter";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { cn } from "../../../../utils/cn";
import { Badge } from "../../../badge";
import { Card } from "../../../card";
import { Sheet, SheetContent, SheetTrigger } from "../../../sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../table";
import { BarChart, BarChartProps } from "../../base/bar-chart";
import { CategoryChart } from "../categories/category-horizontal-chart";

export interface NetExpenseChartProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BarChartProps, "data"> {
  className?: string;
  title: string;
  viewMoreHref?: string;
  price: number;
  priceChange: number;
  expenseMetrics: ExpenseMetrics[];
}

export const NetExpenseChart: React.FC<NetExpenseChartProps> = ({
  className,
  title,
  disabled,
  viewMoreHref,
  enableAssistantMode,
  enableComparison,
  price,
  priceChange,
  expenseMetrics,
  ...rest
}) => {
  const rootClassName = cn(
    "w-full bg-background text-foreground p-6",
    className,
    disabled && "opacity-50 pointer-events-none",
  );

  // generate the net Expense data if disabled
  if (disabled) {
    expenseMetrics =
      FinancialDataGenerator.generateExpenseMetricsAcrossManyYears(2022, 2024);
  }

  const netExpenseData = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.convertDataToChartDataPoints(
      expenseMetrics,
      "expense",
    );
  }, [expenseMetrics]);
  0;

  const yearlyTotalExpense = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeTotalExpenseByYear(
      expenseMetrics,
    );
  }, [expenseMetrics]);

  const yearlyAverageMonthlyExpense = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeAverageMonthlyExpenseByYear(
      expenseMetrics,
    );
  }, [expenseMetrics]);

  const hasData = expenseMetrics.length > 0;

  const years = useMemo(() => {
    return Object.keys(yearlyTotalExpense).sort(
      (a, b) => Number(a) - Number(b),
    );
  }, [yearlyTotalExpense]);

  const monthlyExpense = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeMonthlyExpense(
      expenseMetrics,
    );
  }, [expenseMetrics]);

  const expenseByCategory = useMemo(() => {
    const categories =
      FinancialExpenseAndIncomeMetricsConverter.computeExpenseByCategory(
        expenseMetrics,
      );
    return categories;
  }, [expenseMetrics]);

  return (
    <Card className={rootClassName} {...rest}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">Net Expense</h2>
          <p className="text-sm text-muted-foreground">{title}</p>
          {hasData ? (
            <>
              <div className="mt-2 text-3xl font-bold text-foreground">
                ${price}
              </div>
              <div className="flex items-center mt-1">
                <Badge variant="default" className="border p-[2%]">
                  {priceChange}%
                </Badge>
                <span className="ml-2 text-sm text-muted-foreground">
                  vs {price} in previous month
                </span>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No data available
            </p>
          )}
        </div>
        {hasData && (
          <Sheet>
            <SheetTrigger asChild>
              <button className="text-sm text-muted-foreground flex items-center">
                View More <ArrowRightIcon className="ml-1 h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent className="w-full md:min-w-[70%] scrollbar-hide overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                Net Expense details
              </h2>
              <h3 className="text-md font-semibold mt-4 mb-2">
                Expense this month
              </h3>
              <div>
                <BarChart
                  currency="USD"
                  data={netExpenseData}
                  height={300}
                  locale="en-US"
                  enableAssistantMode={false}
                  enableComparison={false}
                  disabled={disabled}
                />
              </div>
              <div className="mt-6">
                <h3 className="text-md font-semibold mb-2">Key Metrics</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {years.map((year) => (
                        <TableHead key={year}>{year}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Average Monthly Expense</TableCell>
                      {years.map((year) => (
                        <TableCell key={year}>
                          $
                          {yearlyAverageMonthlyExpense[Number(year)]?.toFixed(
                            2,
                          ) || "N/A"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Year Total Expense</TableCell>
                      {years.map((year) => (
                        <TableCell key={year}>
                          $
                          {yearlyTotalExpense[Number(year)]?.toFixed(2) ||
                            "N/A"}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 border-t flex flex-col gap-6">
                <div className="mt-6">
                  <CategoryChart
                    data={expenseByCategory}
                    title={"Expense by Category"}
                    description={"Expense by Category over time"}
                  />
                </div>
                <Card className="flex flex-col gap-3 p-[2%] border-none">
                  {monthlyExpense.map(({ month, year, totalExpense }) => (
                    <div key={`${month}-${year}`}>
                      <div className="flex flex-1 items-center justify-between">
                        <p className="text-md font-bold">
                          {month} {year}
                        </p>
                        <p className="text-sm font-semibold">
                          ${totalExpense.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <p className="text-sm font-normal">
                          {month.substring(0, 3)}'
                          {year.toString().substring(2, 4)} Total Expense
                        </p>
                        <p className="text-xs font-semibold">
                          {totalExpense.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
      <div className="mt-6">
        {hasData ? (
          <BarChart
            currency="USD"
            data={netExpenseData}
            height={300}
            locale="en-US"
            enableAssistantMode={enableAssistantMode}
            enableComparison={enableComparison}
            disabled={disabled}
          />
        ) : (
          <p className="text-center text-muted-foreground">
            No chart data available
          </p>
        )}
      </div>
    </Card>
  );
};
