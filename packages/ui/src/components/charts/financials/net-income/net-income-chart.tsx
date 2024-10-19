import { IncomeMetrics } from "client-typescript-sdk";
import { ArrowRightIcon } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "../../../../components/badge";
import { Card } from "../../../../components/card";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../../../../components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/table";
import { FinancialExpenseAndIncomeMetricsConverter } from "../../../../lib/converters/expense-and-income-metrics-converter";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { cn } from "../../../../utils/cn";
import { BarChart, BarChartProps } from "../../base/bar-chart";
import { CategoryChart } from "../categories/category-horizontal-chart";

export interface NetIncomeChartProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BarChartProps, "data"> {
  className?: string;
  title: string;
  viewMoreHref?: string;
  price: number;
  priceChange: number;
  incomeMetrics: IncomeMetrics[];
}

export const NetIncomeChart: React.FC<NetIncomeChartProps> = ({
  className,
  title,
  disabled,
  viewMoreHref,
  enableAssistantMode,
  enableComparison,
  price,
  priceChange,
  incomeMetrics,
  ...rest
}) => {
  const rootClassName = cn(
    "w-full bg-background text-foreground p-6",
    className,
    disabled && "opacity-50 pointer-events-none",
  );

  // generate the net income data if disabled
  if (disabled) {
    incomeMetrics = FinancialDataGenerator.generateIncomeMetricsAcrossManyYears(
      2022,
      2024,
    );
  }

  const netIncomeData = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.convertDataToChartDataPoints(
      incomeMetrics,
      "income",
    );
  }, [incomeMetrics]);

  console.log(netIncomeData);

  const yearlyTotalIncome = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeTotalIncomeByYear(
      incomeMetrics,
    );
  }, [incomeMetrics]);

  const yearlyAverageMonthlyIncome = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeAverageMonthlyIncomeByYear(
      incomeMetrics,
    );
  }, [incomeMetrics]);

  const hasData = incomeMetrics.length > 0;

  const years = useMemo(() => {
    return Object.keys(yearlyTotalIncome).sort((a, b) => Number(a) - Number(b));
  }, [yearlyTotalIncome]);

  const monthlyIncome = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeMonthlyIncome(
      incomeMetrics,
    );
  }, [incomeMetrics]);

  const incomeByCategory = useMemo(() => {
    const categories =
      FinancialExpenseAndIncomeMetricsConverter.computeIncomeByCategory(
        incomeMetrics,
      );
    return categories;
  }, [incomeMetrics]);

  return (
    <Card className={rootClassName} {...rest}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">Net income</h2>
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
              <h2 className="text-lg font-semibold mb-4">Net income details</h2>
              <h3 className="text-md font-semibold mt-4 mb-2">
                Income this month
              </h3>
              <div>
                <BarChart
                  currency="USD"
                  data={netIncomeData}
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
                      <TableCell>Average Monthly Income</TableCell>
                      {years.map((year) => (
                        <TableCell key={year}>
                          $
                          {yearlyAverageMonthlyIncome[Number(year)]?.toFixed(
                            2,
                          ) || "N/A"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Year Total Income</TableCell>
                      {years.map((year) => (
                        <TableCell key={year}>
                          $
                          {yearlyTotalIncome[Number(year)]?.toFixed(2) || "N/A"}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 border-t flex flex-col gap-6">
                <div className="mt-6">
                  <CategoryChart
                    data={incomeByCategory}
                    title={"Income by Category"}
                    description={"Income by Category over time"}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  {monthlyIncome.map(({ month, year, totalIncome }) => (
                    <div key={`${month}-${year}`}>
                      <div className="flex flex-1 items-center justify-between">
                        <p className="text-md font-bold">
                          {month} {year}
                        </p>
                        <p className="text-sm font-semibold">
                          ${totalIncome.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <p className="text-sm font-normal">
                          {month.substring(0, 3)}'
                          {year.toString().substring(2, 4)} Total Income
                        </p>
                        <p className="text-xs font-semibold">
                          {totalIncome.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
      <div className="mt-6">
        {hasData ? (
          <BarChart
            currency="USD"
            data={netIncomeData}
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
