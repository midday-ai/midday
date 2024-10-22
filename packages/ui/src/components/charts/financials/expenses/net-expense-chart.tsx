import { ExpenseMetrics } from "client-typescript-sdk";
import { ArrowRightIcon, Calendar, DollarSignIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import React, { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { FinancialExpenseAndIncomeMetricsConverter } from "../../../../lib/converters/expense-and-income-metrics-converter";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { cn } from "../../../../utils/cn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../..//tabs";
import { Badge } from "../../../badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../select";
import { Sheet, SheetContent, SheetTrigger } from "../../../sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../table";
import { AnalyticsChart } from "../../base/analytics-chart";
import { AreaChart } from "../../base/area-chart";

export interface NetExpenseChartProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  title: string;
  viewMoreHref?: string;
  price: number;
  priceChange: number;
  expenseMetrics: ExpenseMetrics[];
  currency: string;
  locale?: string;
  enableAssistantMode?: boolean;
  enableComparison?: boolean;
  disabled?: boolean;
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
  currency,
  locale,
  ...rest
}) => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("overview");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(value);
  };


  const rootClassName = cn(
    "w-full bg-background text-foreground p-6 h-full border-none shadow-none",
    className,
    disabled && "opacity-50 pointer-events-none",
  );

  // generate the net Expense data if disabled
  const data = useMemo(() => {
    if (disabled) {
      return FinancialDataGenerator.generateExpenseMetricsAcrossManyYears(2022, 2024);
    }
    return expenseMetrics;
  }, [disabled, expenseMetrics]);

  const [selectedMonth, setSelectedMonth] = useState<string>("");


  const getMonthAbbreviation = (monthName: string) => {
    return monthName.slice(0, 3);
  };

  const calculateMonthlyChange = (currentExpense: number, previousExpense: number) => {
    if (!previousExpense) return 0;
    return ((currentExpense - previousExpense) / previousExpense) * 100;
  };

  const netExpenseData = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.convertDataToChartDataPoints(
      data,
      "expense",
    );
  }, [data]);

  const yearlyTotalExpense = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeTotalExpenseByYear(
      data,
    );
  }, [data]);

  const yearlyAverageMonthlyExpense = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeAverageMonthlyExpenseByYear(
      data,
    );
  }, [data]);

  const hasData = data.length > 0;

  const years = useMemo(() => {
    return Object.keys(yearlyTotalExpense).sort(
      (a, b) => Number(a) - Number(b),
    );
  }, [yearlyTotalExpense]);

  const monthlyExpense = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeMonthlyExpense(
      data,
    );
  }, [data]);

  const monthlyExpenseData = useMemo(() => {
    return monthlyExpense
      .filter(({ year }) => !selectedYear || year.toString() === selectedYear)
      .map(({ month, year, totalExpense }) => ({
        month,
        year,
        totalExpense,
        formattedExpense: formatCurrency(totalExpense),
      }));
  }, [monthlyExpense, selectedYear]);

  const selectedMonthData = useMemo(() => {
    return monthlyExpenseData.find(({ month, year }) =>
      `${month}-${year}` === selectedMonth
    );
  }, [monthlyExpenseData, selectedMonth]);

  const expenseByCategory = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeExpenseByCategory(
      data,
    );
  }, [data]);

  const chartData = useMemo(() => {
    return netExpenseData.map((item) => ({
      date: item.date,
      expense: Number(item.value)
    }));
  }, [netExpenseData]);

  // get the data keys
  const dataKeys = ["expense"];



  const renderTrend = () => {
    const TrendIcon = priceChange >= 0 ? TrendingUpIcon : TrendingDownIcon;
    const trendColor = priceChange >= 0 ? "text-green-500" : "text-red-500";
    return (
      <div className={`flex items-center ${trendColor}`}>
        <TrendIcon className="w-4 h-4 mr-1" />
        <span>{Math.abs(priceChange)}%</span>
      </div>
    );
  };

  return (
    <Card className={rootClassName} {...rest}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Net Expense</CardTitle>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(price)}
                </div>
                <div className="flex items-center mt-1">
                  <Badge variant={priceChange <= 0 ? "destructive" : "default"} className="mr-2">
                    {renderTrend()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    vs previous month
                  </span>
                </div>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <button className="text-sm text-primary flex items-center hover:underline">
                    View Details <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </button>
                </SheetTrigger>
                <SheetContent className="w-full md:max-w-[800px] bg-background text-foreground overflow-y-auto">
                  <Tabs defaultValue="overview" className="w-full" onValueChange={(value) => setSelectedTab(value)}>
                    <TabsList className="grid w-full grid-cols-2 sticky top-0 bg-background z-10">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                      <h2 className="text-lg font-semibold mb-4">Expense Overview</h2>
                      <AreaChart currency={currency} data={netExpenseData} />
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
                                  {formatCurrency(yearlyAverageMonthlyExpense[Number(year)] || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell>Year Total Expense</TableCell>
                              {years.map((year) => (
                                <TableCell key={year}>
                                  {formatCurrency(yearlyTotalExpense[Number(year)] || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    <TabsContent value="monthly" className="h-[calc(100vh-120px)] overflow-y-auto scroll-smooth">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-2xl font-bold">Monthly Expenses</CardTitle>
                          <CardDescription>Analyze your monthly spending patterns</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex space-x-4 mb-6 sticky top-0 bg-background z-10 py-2">
                            <Select onValueChange={(value) => setSelectedYear(value)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Year" />
                              </SelectTrigger>
                              <SelectContent>
                                {years.map((year) => (
                                  <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select onValueChange={(value) => setSelectedMonth(value)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Month" />
                              </SelectTrigger>
                              <SelectContent>
                                {monthlyExpenseData.map(({ month, year }) => (
                                  <SelectItem key={`${month}-${year}`} value={`${month}-${year}`}>
                                    {month} {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Expense Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={monthlyExpenseData}>
                                      <XAxis dataKey="month" tickFormatter={getMonthAbbreviation} />
                                      <YAxis />
                                    
                                      <Bar dataKey="totalExpense" fill="#333" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Monthly Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  {selectedMonthData ? (
                                    <div>
                                      <div className="flex items-center mb-4">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <h3 className="text-xl font-semibold">{selectedMonthData.month} {selectedMonthData.year}</h3>
                                      </div>
                                      <Table>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell>Total Expense</TableCell>
                                            <TableCell className="text-right font-semibold">
                                              {selectedMonthData.formattedExpense}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>vs Previous Month</TableCell>
                                            <TableCell className="text-right">
                                              {calculateMonthlyChange(
                                                selectedMonthData.totalExpense,
                                                monthlyExpenseData[monthlyExpenseData.indexOf(selectedMonthData) - 1]?.totalExpense || 0
                                              ).toFixed(2)}%
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>Average Daily Expense</TableCell>
                                            <TableCell className="text-right">
                                              {formatCurrency(selectedMonthData.totalExpense / 30)}
                                            </TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </div>
                                  ) : (
                                    <p className="text-center text-muted-foreground">Select a month to view details</p>
                                  )}
                                </CardContent>
                              </Card>
                            </div>

                            <div className="mt-6">
                              <CardHeader>
                                <CardTitle className="text-lg">Monthly Expense Breakdown</CardTitle>
                              </CardHeader>
                              <div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Month</TableHead>
                                      <TableHead>Year</TableHead>
                                      <TableHead>Total Expense</TableHead>
                                      <TableHead>Change</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {monthlyExpenseData.map(({ month, year, totalExpense, formattedExpense }, index) => (
                                      <TableRow key={`${month}-${year}`}>
                                        <TableCell>{month}</TableCell>
                                        <TableCell>{year}</TableCell>
                                        <TableCell>{formattedExpense}</TableCell>
                                        <TableCell>
                                          {index > 0 ? (
                                            <span className={calculateMonthlyChange(totalExpense, monthlyExpenseData[index - 1]?.totalExpense ?? 0) >= 0 ? "text-red-500" : "text-green-500"}>
                                              {calculateMonthlyChange(totalExpense, monthlyExpenseData[index - 1]?.totalExpense ?? 0).toFixed(2)}%
                                            </span>
                                          ) : "-"}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </SheetContent>
              </Sheet>
            </div>
            <AnalyticsChart
              chartData={chartData}
              title="Net Expense Over Time"
              description={`Net expense over time in ${currency}`}
              dataKeys={dataKeys as any}
              colors={["#333"]}
              trendKey="expense"
              chartType="bar"
              currency={currency}
              height={300}
              locale={locale}
              enableAssistantMode={enableAssistantMode}
              disabled={disabled}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <DollarSignIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              No expense data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
