import { IncomeMetrics } from "client-typescript-sdk";
import { ArrowRightIcon, Calendar, DollarSignIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import React, { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FinancialExpenseAndIncomeMetricsConverter } from "../../../../lib/converters/expense-and-income-metrics-converter";
import { FinancialDataGenerator, } from "../../../../lib/random/financial-data-generator";
import { cn } from "../../../../utils/cn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../..//tabs";
import { Badge } from "../../../badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../select";
import { Sheet, SheetContent, SheetTrigger } from "../../../sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../table";
import { AnalyticsChart } from "../../base/analytics-chart";
import { AreaChart } from "../../base/area-chart";

export interface NetIncomeChartProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  title: string;
  viewMoreHref?: string;
  price: number;
  priceChange: number;
  incomeMetrics: IncomeMetrics[];
  currency: string;
  locale?: string;
  enableAssistantMode?: boolean;
  enableComparison?: boolean;
  disabled?: boolean;
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

  // generate the net Income data if disabled
  const data = useMemo(() => {
    if (disabled) {
      return FinancialDataGenerator.generateIncomeMetricsAcrossManyYears(2022, 2024);
    }
    return incomeMetrics;
  }, [disabled, incomeMetrics]);

  const [selectedMonth, setSelectedMonth] = useState<string>("");


  const getMonthAbbreviation = (monthName: string) => {
    return monthName.slice(0, 3);
  };

  const calculateMonthlyChange = (currentIncome: number, previousIncome: number) => {
    if (!previousIncome) return 0;
    return ((currentIncome - previousIncome) / previousIncome) * 100;
  };

  const netIncomeData = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.convertDataToChartDataPoints(
      data,
      "income",
    );
  }, [data]);

  const yearlyTotalIncome = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeTotalIncomeByYear(
      data,
    );
  }, [data]);

  const yearlyAverageMonthlyIncome = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeAverageMonthlyIncomeByYear(
      data,
    );
  }, [data]);

  const hasData = data.length > 0;

  const years = useMemo(() => {
    return Object.keys(yearlyTotalIncome).sort(
      (a, b) => Number(a) - Number(b),
    );
  }, [yearlyTotalIncome]);

  const monthlyIncome = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeMonthlyIncome(
      data,
    );
  }, [data]);

  const monthlyIncomeData = useMemo(() => {
    return monthlyIncome
      .filter(({ year }) => !selectedYear || year.toString() === selectedYear)
      .map(({ month, year, totalIncome }) => ({
        month,
        year,
        totalIncome,
        formattedIncome: formatCurrency(totalIncome),
      }));
  }, [monthlyIncome, selectedYear]);

  const selectedMonthData = useMemo(() => {
    return monthlyIncomeData.find(({ month, year }) =>
      `${month}-${year}` === selectedMonth
    );
  }, [monthlyIncomeData, selectedMonth]);

  const incomeByCategory = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.computeIncomeByCategory(
      data,
    );
  }, [data]);

  const chartData = useMemo(() => {
    return netIncomeData.map((item) => ({
      date: item.date,
      income: Number(item.value)
    }));
  }, [netIncomeData]);

  // get the data keys
  const dataKeys = ["income"];



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
        <CardTitle className="text-2xl font-bold">Net Income</CardTitle>
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
                  <Badge variant={"default"} className="mr-2">
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
                      <h2 className="text-lg font-semibold mb-4">Income Overview</h2>
                      <AreaChart currency={currency} data={netIncomeData} />
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
                                  {formatCurrency(yearlyAverageMonthlyIncome[Number(year)] || 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell>Year Total Income</TableCell>
                              {years.map((year) => (
                                <TableCell key={year}>
                                  {formatCurrency(yearlyTotalIncome[Number(year)] || 0)}
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
                          <CardTitle className="text-2xl font-bold">Monthly Income</CardTitle>
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
                                {monthlyIncomeData.map(({ month, year }: { month: string; year: number; totalIncome: number; formattedIncome: string }) => (
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
                                  <CardTitle className="text-lg">Income Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={monthlyIncomeData}>
                                      <XAxis dataKey="month" tickFormatter={getMonthAbbreviation} />
                                      {/* <YAxis /> */}

                                      <Bar dataKey="totalIncome" fill="#333" stroke={`url(#333)`}
                                        strokeWidth={3}
                                        className="border border-gray-200 rounded-2xl" />
                                      <defs>
                                        <linearGradient
                                          id="growthGradient"
                                          x1="0"
                                          y1="0"
                                          x2="0"
                                          y2="1"
                                        >
                                          <stop
                                            offset="0%"
                                            stopColor={"#333"}
                                            stopOpacity={0.8}
                                          />
                                          <stop
                                            offset="100%"
                                            stopColor={"#666"}
                                            stopOpacity={0.1}
                                          />
                                        </linearGradient>
                                      </defs>
                                      <Tooltip />
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
                                            <TableCell>Total Income</TableCell>
                                            <TableCell className="text-right font-semibold">
                                              {selectedMonthData.formattedIncome}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>vs Previous Month</TableCell>
                                            <TableCell className="text-right">
                                              {calculateMonthlyChange(
                                                selectedMonthData.totalIncome,
                                                monthlyIncomeData[monthlyIncomeData.indexOf(selectedMonthData) - 1]?.totalIncome || 0
                                              ).toFixed(2)}%
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>Average Daily Income</TableCell>
                                            <TableCell className="text-right">
                                              {formatCurrency(selectedMonthData.totalIncome / 30)}
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
                                <CardTitle className="text-lg">Monthly Income Breakdown</CardTitle>
                              </CardHeader>
                              <div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Month</TableHead>
                                      <TableHead>Year</TableHead>
                                      <TableHead>Total Income</TableHead>
                                      <TableHead>Change</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {monthlyIncomeData.map(({ month, year, totalIncome, formattedIncome }: { month: string; year: number; totalIncome: number; formattedIncome: string }, index: number) => (
                                      <TableRow key={`${month}-${year}`}>
                                        <TableCell>{month}</TableCell>
                                        <TableCell>{year}</TableCell>
                                        <TableCell>{formattedIncome}</TableCell>
                                        <TableCell>
                                          {index > 0 ? (
                                            <span className={calculateMonthlyChange(totalIncome, monthlyIncomeData[index - 1]?.totalIncome ?? 0) >= 0 ? "text-red-500" : "text-green-500"}>
                                              {calculateMonthlyChange(totalIncome, monthlyIncomeData[index - 1]?.totalIncome ?? 0).toFixed(2)}%
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
              title="Net Income Over Time"
              description={`Net income over time in ${currency}`}
              dataKeys={dataKeys as any}
              colors={["#333"]}
              trendKey="income"
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
              No income data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
